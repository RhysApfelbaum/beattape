import { ConsumerMessage, DecodeStreams, ProducerMessage } from './pkg/';
import { memory } from './pkg/decode_streams_bg.wasm'

import './ffi';
import { Readers } from './readers';

const url = 'asdf';

const readers = new Readers();
const streams = DecodeStreams.new();

const bridge = {
    async pump(id: number, offset: number, length: number) {
        // TODO
        const reader = await readers.get(id);
        const { done, value } = await reader.read(
            new Uint8Array(memory.buffer, offset, length)
        );
        return [done, value?.byteLength ?? 0]
    },
    async post_message(message: ProducerMessage) {
        postMessage(message)
    }

    registerURL()
};


self.onmessage = (ev: MessageEvent<ConsumerMessage>) => streams.handle_message(ev.data);
