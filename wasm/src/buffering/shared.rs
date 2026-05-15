use std::{cell::RefCell, ops::{Deref, DerefMut}, rc::Rc};

use bytemuck::Pod;
use futures::{future::poll_fn, task::AtomicWaker};

use crate::buffering::ringbuffer::RingBuffer;

struct Inner<T> {
    buffer: RingBuffer<T>,
    read_waker: AtomicWaker,
    write_waker: AtomicWaker
}

impl<T> Deref for Inner<T> {
    type Target = RingBuffer<T>;
    fn deref(&self) -> &Self::Target {
        &self.buffer
    }
}

impl<T> DerefMut for Inner<T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.buffer
    }
}

impl<T: Pod + Default + Copy> Inner<T> {
    pub fn advance_read(&mut self, length: usize) {
        self.buffer.advance_read(length);
        self.read_waker.wake();
    }

    pub fn advance_write(&mut self, length: usize) {
        self.buffer.advance_write(length);
        self.write_waker.wake();
    }

    pub fn write<'a>(&mut self, chunk: &'a [T]) -> Option<&'a [T]> {
        let leftover = self.buffer.write(chunk);
        self.write_waker.wake();
        leftover
    }

    pub fn register_read_waker(&self, waker: &std::task::Waker) {
        self.read_waker.register(waker);
    }

    pub fn register_write_waker(&self, waker: &std::task::Waker) {
        self.write_waker.register(waker);
    }

}


#[derive(Clone)]
pub struct SharedRingBuffer<T>(Rc<RefCell<Inner<T>>>);

impl<T> Deref for SharedRingBuffer<T> {
    type Target = RefCell<Inner<T>>;
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

        self.borrow().read_waker.register(cx.waker());
        

        let mut remaining: usize = buf.remaining();
        let mut copied: usize = 0;
        {
            let rb = self.borrow();
            if rb.empty() {
                return std::task::Poll::Pending;
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
        std::task::Poll::Ready(Ok(()))
    }
}

impl<T: Pod + Default + Copy> SharedRingBuffer<T> {
    pub async fn can_write(&self) {
        poll_fn(|cx| {
            let rb = self.borrow();
            rb.register_write_waker(cx.waker());
            if rb.full() {
                std::task::Poll::Pending
            } else {
                std::task::Poll::Ready(())
            }
        }).await;
    }
}


impl<T> From<RingBuffer<T>> for SharedRingBuffer<T> {
    fn from(value: RingBuffer<T>) -> Self {
        Self(Rc::new(RefCell::new(Inner {
            buffer: value,
            read_waker: AtomicWaker::new(),
            write_waker: AtomicWaker::new()
        })))
    }
}
