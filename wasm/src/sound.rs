use ogg::{reading::async_api::PacketReader};
use opus_decoder::OpusDecoder;
use wasm_bindgen_futures::spawn_local;
use futures::{StreamExt, stream::{AbortHandle, Abortable}};

use crate::{buffer::{RingBuffer, SharedRingBuffer}, interop::{ReadableRegions, fetch_bytes, register_connection, unregister_connection}};

pub type SoundID = u8;




pub struct SoundHandle {
    id: SoundID,
    pcm: SharedRingBuffer<i16>,
    fetch_handle: AbortHandle,
    decode_handle: AbortHandle
}

impl Drop for SoundHandle {
    fn drop(&mut self) {
        self.fetch_handle.abort();
        self.decode_handle.abort();
        unregister_connection(self.id);
    }

}

impl SoundHandle {
    pub fn read(&self, length: usize) -> ReadableRegions {
        let mut pcm = self.pcm.borrow_mut();
        pcm.advance_read(length);
        pcm.readable_regions()
    }

    pub fn readable_regions(&self) -> ReadableRegions {
        self.pcm.borrow_mut().readable_regions()
    }
}

pub struct Sound {
    url: String,
    pcm_buffer: SharedRingBuffer<i16>,
    fetch_buffer: SharedRingBuffer<u8>,
    decoder: Decoder 
}

impl Sound {
    pub fn new(
        url: String,
        sample_rate: u32,
        channel_count: usize,
        pcm_pointer: u32,
        pcm_length: u32,
    ) -> Self {
        let fetch_buffer: SharedRingBuffer<u8> = RingBuffer::new(1024).into();
        let pcm_buffer: SharedRingBuffer<i16> = unsafe {
            RingBuffer::from_raw_parts(
                pcm_pointer as *mut i16,
                pcm_length as usize
            )
        }.into();
        let decoder = Decoder::new(
            fetch_buffer.clone(),
            pcm_buffer.clone(),
            sample_rate,
            channel_count
        );



        Self {
            url,
            pcm_buffer,
            fetch_buffer,
            decoder: decoder,
        }
    }

    pub fn start(self, id: SoundID) -> SoundHandle {
        register_connection(id, self.url);
        let mut decoder = self.decoder;
        let (fetch_handle, fetch_reg) = AbortHandle::new_pair();
        let (decode_handle, decode_reg) = AbortHandle::new_pair();
        let pcm = self.pcm_buffer.clone();

        spawn_local(async move {
            match Abortable::new(Self::fetch(id, self.fetch_buffer), fetch_reg).await {
                _ => {}
            }
        });

        spawn_local(async move {
            match Abortable::new(decoder.decode(), decode_reg).await {
                _ => {}
            }
        });

        SoundHandle { id, pcm, fetch_handle, decode_handle }
    }

    async fn fetch(id: SoundID, buffer: SharedRingBuffer<u8>) {
        loop {
            if buffer.borrow().full() {
                buffer.can_write().await;
            }

            let region = buffer.borrow_mut().next_writeable_region();
            let bytes = fetch_bytes(id, region).await.unwrap();
            buffer.borrow_mut().advance_write(bytes);
        }
    }
}



struct Decoder {
    decoder: OpusDecoder,
    input: PacketReader<SharedRingBuffer<u8>>,
    output: SharedRingBuffer<i16>
}

impl Decoder {
    fn new(
        input: SharedRingBuffer<u8>,
        output: SharedRingBuffer<i16>,
        sample_rate: u32,
        channel_count: usize
    ) -> Self {
        Self {
            decoder: OpusDecoder::new(sample_rate, channel_count).unwrap(),
            input: PacketReader::new(input),
            output
        }
    }

    async fn decode(&mut self) {
        let mut decoded = [0i16; 960 * 2];

        while let Some(packet) = self.input.next().await {
            let packet = packet.expect("valid ogg packet");
            _ = self.decoder
                .decode(&packet.data, &mut decoded, false)
                .expect("correct decoding");
            self.push_pcm(&decoded).await;

        }
    }

    async fn push_pcm(&self, pcm: &[i16]) {
        let mut pcm = pcm;
        while let Some(leftover) = self.output.borrow_mut().write(pcm) {
            pcm = leftover;
            self.output.borrow().can_write().await;
        }
    }
}
