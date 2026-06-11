import init, { ConsumerMessage, DecodeStreams, ProducerMessage } from './build/worker';
import Connection from './connections';


function ffi(memory: WebAssembly.Memory) {
    return {
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
    }
};


const { memory } = await init();

const bridge = ffi(memory);

declare global { var audioBridge: typeof bridge }

global.audioBridge = bridge;

const connections = new Map<number, Connection>();
const streams = new DecodeStreams();

self.onmessage = (ev: MessageEvent<ConsumerMessage>) => streams.handle_message(ev.data);

