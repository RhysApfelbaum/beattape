use wasm_bindgen::prelude::*;

use crate::{
    interop::{ConsumerMessage, ProducerMessage, send_message},
    sound::{Sound, SoundHandle, SoundID},
};
pub mod buffer;
mod interop;
pub mod sound;

const MAX_SOUNDS: usize = SoundID::MAX as usize;

#[wasm_bindgen]
pub struct DecodeStreams {
    sound_handles: [Option<SoundHandle>; MAX_SOUNDS],
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

    fn get_regions(&self) {
        todo!()
    }

    fn get_handle(&self, id: SoundID) -> Option<&SoundHandle> {
        (&self.sound_handles[id as usize]).as_ref()
    }

    fn get_mut_handle(&mut self, id: SoundID) -> Option<&mut SoundHandle> {
        self.slot(id).as_mut()
    }

    fn remove_sound(&mut self, id: SoundID) -> Option<SoundHandle> {
        self.free.push(id);
        self.slot(id).take()
    }

    fn slot(&mut self, id: SoundID) -> &mut Option<SoundHandle> {
        &mut self.sound_handles[id as usize]
    }

    fn add_sound(&mut self, sound: Sound) -> Option<SoundID> {
        if let Some(id) = self.free.pop() {
            self.slot(id).replace(sound.start(id));
            Some(id)
        } else {
            None
        }
    }

    pub fn handle_message(&mut self, message: ConsumerMessage) {
        match message {
            ConsumerMessage::CreateSound {
                sample_rate,
                channel_count,
                pcm_pointer,
                pcm_length,
            } => {
                let sound = Sound::new(sample_rate, channel_count, pcm_pointer, pcm_length);
                let id = self.add_sound(sound).unwrap();
                send_message(ProducerMessage::AcknowledgeSound(id));
            }
            ConsumerMessage::ReleaseSound(id) => {
                _ = self.remove_sound(id);
            }
            ConsumerMessage::Read(id, length) => {
                let handle = self.get_mut_handle(id).unwrap();
                let regions = handle.read(length);
                send_message(ProducerMessage::AcknowledgeRead(id, regions));
            }
        }
    }
}
