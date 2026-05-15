import { ConsumerMessage } from "./pkg/decode_streams";

export class DecodeStreamsWorker {
    worker: Worker;

    constructor() {
        this.worker = new Worker('./worker.ts');

    }

    postMessage(message: ConsumerMessage) {
        this.worker.postMessage(message);
    }
}
