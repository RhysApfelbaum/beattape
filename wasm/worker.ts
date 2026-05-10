import { ConsumerMessage, DecodeStreams, ProducerMessage } from './pkg/';
import { memory } from './pkg/decode_streams_bg.wasm'

import './ffi';
import { Connection } from './connection';

const connections = new Map<number, Connection>;
const streams = DecodeStreams.new();

const bridge = {
    async pump(id: number, offset: number, length: number) {
        // TODO
        const connection = connections.get(id);
        if (!connection) {
            throw new Error('unregistered connection');
        }
        const reader = await connection.reader;
        const { done, value } = await reader.read(
            new Uint8Array(memory.buffer, offset, length)
        );

        if (done) {
            connection.restart();
        }
        return value?.byteLength;
    },

    async post_message(message: ProducerMessage) {
        postMessage(message)
    },

    register_connection(id: number, url: string) {
        if (connections.has(id)) {
            throw new Error('doubly registered connection');
        }
        connections.set(id, new Connection(url));
    },

    unregister_connection(id: number) {
        connections.delete(id);
    }
};

self.onmessage = (ev: MessageEvent<ConsumerMessage>) => streams.handle_message(ev.data);

