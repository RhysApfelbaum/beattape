import { ConsumerMessage } from '../pkg/';

const bridge = {
    async pump(id: number, length: number, offset: number) {
        // TODO
        return [true, 0];
    },
    async post_message(message: ConsumerMessage) {
        postMessage(message);
    }
};

declare global { var audioBridge: typeof bridge }

global.audioBridge = bridge;
