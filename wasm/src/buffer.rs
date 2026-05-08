use bytemuck::Pod;
use futures::{future::{Shared, poll_fn}, task::AtomicWaker};
use std::{
    cell::{RefCell}, ops::{Deref, DerefMut}, rc::Rc, slice, task::{Poll}
};

use crate::interop::{FetchResult, ReadableRegions, Region, fetch_bytes};

struct WriteWaiter {
    waker: AtomicWaker,
}

impl WriteWaiter {
    fn new() -> Self {
        Self {
            waker: AtomicWaker::new(),
        }
    }

    pub async fn can_write<F>(&self, can_write: F)
    where
        F: Fn() -> bool
    {
        poll_fn(|context| {
            self.waker.register(context.waker());
            if can_write() {
                Poll::Ready(())
            } else {
                Poll::Pending
            }
        }).await
    }

    fn wake(&self) {
        self.waker.wake();
    }
}

enum Buffer<T> {
    Owned(Box<[T]>),
    Raw {
        pointer: *mut T,
        length: usize
    }
}

impl<T> Deref for Buffer<T> {
    type Target = [T];
    fn deref(&self) -> &Self::Target {
        match self {
            Self::Owned(b) => b,
            Self::Raw { pointer, length } => unsafe {
                slice::from_raw_parts(*pointer, *length)
            }
        }
    }
}

impl<T> DerefMut for Buffer<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        match self {
            Self::Owned(b) => b,
            Self::Raw { pointer, length } => unsafe {
                slice::from_raw_parts_mut(*pointer, *length)
            }
        }
    }
}

pub struct RingBuffer<T> {
    buffer: Buffer<T>,
    read_index: usize,
    write_index: usize,
    full: bool,
    waiter: WriteWaiter
}

impl<T: Default + Copy + Pod> RingBuffer<T> {
    pub fn new(capacity: usize) -> Self {
        let buffer = vec![T::default(); capacity].into_boxed_slice();
        Self {
            buffer: Buffer::Owned(buffer),
            read_index: 0,
            write_index: 0,
            full: false,
            waiter: WriteWaiter::new()
        }
    }

    pub unsafe fn from_raw_parts(pointer: *mut T, length: usize) -> Self {
        Self {
            buffer: Buffer::Raw { pointer, length },
            read_index: 0,
            write_index: 0,
            full: false,
            waiter: WriteWaiter::new()
        }
    }

    pub unsafe fn from_region(region: Region) -> Self {
        unsafe {
            Self::from_raw_parts(region.offset as *mut T, region.length as usize)
        }
    }

    #[inline]
    pub fn capacity(&self) -> usize {
        self.buffer.len()
    }

    #[inline]
    pub fn full(&self) -> bool {
        self.full
    }

    #[inline]
    pub fn filled_length(&self) -> usize {
        if self.full {
            self.capacity()
        } else if self.write_index >= self.read_index {
            self.write_index - self.read_index
        } else {
            self.capacity() - (self.read_index - self.write_index)
        }
    }

    #[inline]
    pub fn empty(&self) -> bool {
        self.filled_length() == 0
    }

    #[inline]
    pub fn empty_length(&self) -> usize {
        self.capacity() - self.filled_length()
    }

    #[inline]
    pub fn advance_read(&mut self, length: usize) {
        if length > self.filled_length() {
            panic!("buffer underflow");
        }
        self.read_index = (self.read_index + length) % self.capacity();
        if length > 0 {
            self.full = false;
        }
        self.waiter.wake();
    }

    #[inline]
    pub fn advance_write(&mut self, length: usize) {
        if length > self.empty_length() {
            panic!("buffer overflow");
        }
        self.write_index = (self.write_index + length) % self.capacity();

        if self.read_index == self.write_index {
            self.full = true;
        }
    }

    fn slices(&self) -> (&[T], &[T]) {
        let readable = self.filled_length();
        let length = readable.min(self.capacity() - self.read_index);
        let wrapped_length = readable.saturating_sub(length);

        let (left, right) = self.buffer.split_at(self.read_index);
        (&right[..length], &left[..wrapped_length])
    }

    fn empty_slices(&mut self) -> (&mut [T], &mut [T]) {
        let writeable = self.empty_length();
        let length = writeable.min(self.capacity() - self.write_index);
        let wrapped_length = writeable.saturating_sub(length);

        let (left, right) = self.buffer.split_at_mut(self.write_index);
        (&mut right[..length], &mut left[..wrapped_length])
    }

    pub fn write<'a>(&mut self, chunk: &'a [T]) -> Option<&'a [T]> {
        let writeable = self.empty_length();

        let (chunk, leftover) = if chunk.len() > writeable {
            (&chunk[..writeable], Some(&chunk[writeable..]))
        } else {
            (chunk, None)
        };

        let (left, right) = self.empty_slices();

        for (slot, value) in left.iter_mut().chain(right.iter_mut()).zip(chunk) {
            *slot = *value;
        }
        self.advance_write(chunk.len());
        leftover
    }

    pub fn next_writeable_region(&mut self) -> Region {
        bytemuck::cast_slice(self.empty_slices().0).into()
    }

    pub fn readable_regions(&self) -> ReadableRegions {
        let (main, wrap) = self.slices();
        ReadableRegions::new(bytemuck::cast_slice(main), bytemuck::cast_slice(wrap))
    }

    pub fn free_up_space(&mut self, length: usize) {
        let length = length.min(self.filled_length());
        self.advance_read(length);
    }

    pub async fn can_write(&self) {
        self.waiter.can_write(|| !self.full).await
    }
}


#[derive(Clone)]
pub struct SharedRingBuffer<T>(Rc<RefCell<RingBuffer<T>>>);

impl<T> Deref for SharedRingBuffer<T> {
    type Target = RefCell<RingBuffer<T>>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl tokio::io::AsyncRead for SharedRingBuffer<u8> {
    fn poll_read(
        self: std::pin::Pin<&mut Self>,
        cx: &mut std::task::Context<'_>,
        buf: &mut tokio::io::ReadBuf<'_>,
    ) -> std::task::Poll<std::io::Result<()>> {

        self.borrow().waiter.waker.register(cx.waker());
        

        let mut remaining: usize = buf.remaining();
        let mut copied: usize = 0;
        {
            let rb = self.borrow();
            if rb.empty() {
                return Poll::Pending;
            }
            let (left, right) = rb.slices();
            for chunk in [left, right] {
                if remaining == 0 {
                    break;
                }
                let length = chunk.len().min(remaining);
                buf.put_slice(&chunk[..length]);
                copied += length;
                remaining -= length;
            }
        }

        self.borrow_mut().advance_read(copied);
        Poll::Ready(Ok(()))
    }
}

impl<T> SharedRingBuffer<T> {
    pub async fn can_write(&self) {
        self.borrow().waiter.can_write(
            || !self.borrow().full
        ).await
    }
}


impl<T> From<RingBuffer<T>> for SharedRingBuffer<T> {
    fn from(value: RingBuffer<T>) -> Self {
        Self(Rc::new(RefCell::new(value)))
    }
}
