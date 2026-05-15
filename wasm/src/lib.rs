use wasm_bindgen::prelude::*;

use crate::{
    interop::{ConsumerMessage, ProducerMessage, StreamInfo, send_message}, sound::{SoundID, StreamHandle}
};
pub mod buffering;
mod interop;
pub mod sound;

const MAX_SOUNDS: usize = SoundID::MAX as usize;

#[wasm_bindgen]
pub struct DecodeStreams {
    sound_handles: [Option<StreamHandle>; MAX_SOUNDS],
    free: Vec<SoundID>,
}

#[wasm_bindgen]
impl DecodeStreams {
    pub fn new() -> Self {
        let mut free = Vec::new();
        for i in 0..MAX_SOUNDS {
            free.push((MAX_SOUNDS - i) as SoundID);
        }

        Self {
            sound_handles: std::array::from_fn(|_| None),
            free,
        }
    }

    #[inline]
    fn get_mut_handle(&mut self, id: SoundID) -> Option<&mut StreamHandle> {
        self.slot(id).as_mut()
    }

    fn slot(&mut self, id: SoundID) -> &mut Option<StreamHandle> {
        &mut self.sound_handles[id as usize]
    }

    fn add_stream(&mut self, info: StreamInfo) -> Option<SoundID> {
        if let Some(id) = self.free.pop() {
            self.slot(id).replace(StreamHandle::new(id, info));
            Some(id)
        } else {
            None
        }
    }

    fn remove_stream(&mut self, id: SoundID) -> Option<StreamHandle> {
        self.free.push(id);
        self.slot(id).take()
    }

    pub fn handle_message(&mut self, message: ConsumerMessage) {
        match message {
            ConsumerMessage::CreateStream(info) => {
                let id = self.add_stream(info).unwrap();
                send_message(ProducerMessage::AcknowledgeStream(id));
            }
            ConsumerMessage::ReleaseStream(id) => {
                _ = self.remove_stream(id);
            }
            ConsumerMessage::Read(id, length) => {
                let stream = self.get_mut_handle(id).unwrap();
                let regions = stream.read(length);
                send_message(ProducerMessage::AcknowledgeRead(id, regions));
            }
        }
    }
}
