
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
use wasm_bindgen_futures::{JsFuture, js_sys::Promise};

use crate::stream::SoundID;

#[wasm_bindgen]
extern "C" {
    fn post_message(message: JsValue);
    fn pump(id: SoundID, offset: u32, length: u32) -> Promise;
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(from_wasm_abi, into_wasm_abi)]
pub struct StreamInfo {
    pub url: String,
    pub sample_rate: u32,
    pub channel_count: usize,
    pub pcm_pointer: u32,
    pub pcm_length: u32,
}

pub async fn fetch_bytes(id: SoundID, region: Region) -> Result<usize, JsValue> {
    let result = JsFuture::from(pump(id, region.offset, region.length)).await?;
    let bytes = result.as_f64().expect("fetch_bytes should return a number");
    Ok(bytes as usize)
}

pub fn send_message(message: ProducerMessage) {
    post_message(serde_wasm_bindgen::to_value(&message).expect("should be a valid ProducerMessage"));
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(from_wasm_abi, into_wasm_abi)]
pub enum ProducerMessage {
    AcknowledgeStream(SoundID),
    AcknowledgeRead(SoundID, ReadableRegions),
    Write(SoundID, ReadableRegions),
    Error,
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(from_wasm_abi, into_wasm_abi)]
pub enum ConsumerMessage {
    CreateStream(StreamInfo),
    ReleaseStream(SoundID),
    Read(SoundID, usize),
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct ReadableRegions {
    length: u32,
    main: Region,
    wrap: Region
}

impl ReadableRegions {
    pub fn new(main: &[u8], wrap: &[u8]) -> Self {
        let length = main.len() + wrap.len();
        Self {
            length: length as u32,
            main: main.into(),
            wrap: wrap.into()
        }
    }
}

#[derive(Serialize, Deserialize, Tsify, Clone, Copy)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct Region {
    pub offset: u32,
    pub length: u32
}

impl From<&[u8]> for Region {
    fn from(value: &[u8]) -> Self {
        Self {
            offset: value.as_ptr() as u32,
            length: value.len() as u32
        }
    }
}

