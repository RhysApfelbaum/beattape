use ogg::{reading::async_api::PacketReader};
use opus_decoder::OpusDecoder;
use wasm_bindgen_futures::spawn_local;
use futures::{StreamExt, stream::{AbortHandle, Abortable}};

use crate::{buffering::{RingBuffer, SharedRingBuffer}, interop::{ReadableRegions, StreamInfo, fetch_bytes, send_message}};

pub type SoundID = u8;




pub struct StreamHandle {
    pcm: SharedRingBuffer<i16>,
    fetch_handle: AbortHandle,
    decode_handle: AbortHandle
}

impl Drop for StreamHandle {
    fn drop(&mut self) {
        self.fetch_handle.abort();
        self.decode_handle.abort();
    }

}

impl StreamHandle {
    pub fn new(id: SoundID, info: StreamInfo) -> Self {
        let fetch_buffer: SharedRingBuffer<u8> = RingBuffer::new(1024).into();

        let pcm: SharedRingBuffer<i16> = unsafe {
            RingBuffer::from_raw_parts(
                info.pcm_pointer as *mut i16,
                info.pcm_length as usize
            )
        }.into();

        let mut decoder = Decoder::new(
            id,
            fetch_buffer.clone(),
            pcm.clone(),
            info.sample_rate,
            info.channel_count
        );

        let (fetch_handle, fetch_reg) = AbortHandle::new_pair();
        let (decode_handle, decode_reg) = AbortHandle::new_pair();

        spawn_local(async move {
            match Abortable::new(fetch(id, fetch_buffer), fetch_reg).await {
                _ => {}
            }
        });

        spawn_local(async move {
            match Abortable::new(decoder.decode(), decode_reg).await {
                _ => {}
            }
        });

        Self { pcm, fetch_handle, decode_handle }
    }

    pub fn read(&self, length: usize) -> ReadableRegions {
        let mut pcm = self.pcm.borrow_mut();
        pcm.advance_read(length);
        pcm.readable_regions()
    }

    pub fn readable_regions(&self) -> ReadableRegions {
        self.pcm.borrow_mut().readable_regions()
    }
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

pub struct Decoder {
    id: u8,
    decoder: OpusDecoder,
    input: PacketReader<SharedRingBuffer<u8>>,
    output: SharedRingBuffer<i16>
}

impl Decoder {
    pub fn new(
        id: u8,
        input: SharedRingBuffer<u8>,
        output: SharedRingBuffer<i16>,
        sample_rate: u32,
        channel_count: usize
    ) -> Self {
        Self {
            id,
            decoder: OpusDecoder::new(sample_rate, channel_count).unwrap(),
            input: PacketReader::new(input),
            output
        }
    }

    pub async fn decode(&mut self) {
        let mut decoded = [0i16; 960 * 2];

        while let Some(packet) = self.input.next().await {
            let packet = packet.expect("valid ogg packet");
            _ = self.decoder
                .decode(&packet.data, &mut decoded, false)
                .expect("correct decoding");
            self.push_pcm(&decoded).await;
            send_message(crate::interop::ProducerMessage::Write(self.id, self.output.borrow().readable_regions()));
        }
    }

    async fn push_pcm(&self, pcm: &[i16]) {
        let mut pcm = pcm;
        while let Some(leftover) = self.output.borrow_mut().write(pcm) {
            pcm = leftover;
            self.output.can_write().await;
        }
    }
}
