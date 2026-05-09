
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::{JsValue, prelude::wasm_bindgen};
use wasm_bindgen_futures::{JsFuture, js_sys::Promise};
use web_sys::js_sys::{Array};

use crate::sound::SoundID;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen]
    fn post_message(message: JsValue);

    fn pump(id: SoundID, offset: u32, length: u32) -> Promise;
}

pub struct FetchResult {
    pub done: bool,
    pub bytes: usize
}

pub async fn fetch_bytes(id: SoundID, region: Region) -> Result<FetchResult, JsValue> {
    let result = JsFuture::from(pump(id, region.offset, region.length)).await?;
    let array = Array::from(&result);
    let done = array.get(0).as_bool().ok_or("not a bool")?;
    let bytes = array.get(0).as_f64().ok_or("not a number")? as usize;
    Ok(FetchResult { done, bytes })
}

pub fn send_message(message: ProducerMessage) {
    post_message(serde_wasm_bindgen::to_value(&message).unwrap());
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(from_wasm_abi, into_wasm_abi)]
pub enum ProducerMessage {
    AcknowledgeSound(SoundID),
    AcknowledgeRead(SoundID, ReadableRegions),
    Write(SoundID, ReadableRegions),
    Error,
}

#[derive(Serialize, Deserialize, Tsify)]
#[tsify(from_wasm_abi, into_wasm_abi)]
pub enum ConsumerMessage {
    CreateSound {
        url: String,
        sample_rate: u32,
        channel_count: usize,
        pcm_pointer: u32,
        pcm_length: u32
    },
    ReleaseSound(SoundID),
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

