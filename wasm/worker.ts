import { ConsumerMessage, DecodeStreams, ProducerMessage } from './pkg/';
import { memory } from './pkg/decode_streams_bg.wasm'

import './ffi';
import Connection from './connections';

const connections = new Map<number, Connection>();
const streams = DecodeStreams.new();

const bridge = {
    async pump(id: number, offset: number, length: number) {
        const connection = connections.get(id);

        if (!connection) {
            throw new Error('no connection with id');
        }

        const reader = await connection.reader;

        const { done, value } = await reader.read(
            new Uint8Array(memory.buffer, offset, length)
        );

        if (done) {
            connection.restart();
        }

        return value?.length ?? 0;
    },

    async post_message(message: ProducerMessage) {
        postMessage(message)
    }
};

self.onmessage = (ev: MessageEvent<ConsumerMessage>) => streams.handle_message(ev.data);
