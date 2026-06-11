import { ConsumerMessage } from "./pkg/decode_streams";
import { memory } from "./pkg/decode_streams_bg.wasm";
export type * from './pkg/decode_streams.d.ts';

export class DecodeStreamsWorker {
    worker: Worker;

    constructor() {
        this.worker = new Worker('./worker.ts');
    }

    get HEAP() {
        return new Uint8Array(memory.buffer);
    }

    postMessage(message: ConsumerMessage) {
        this.worker.postMessage(message);
    }

}

