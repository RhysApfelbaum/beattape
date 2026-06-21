import { ReadResult } from "./buffering";
import { PromiseStatus } from "./promiseStatus";


const ringBufferDefaultOptions = {
    hotThreshold: 1000
};

export class RingBuffer {
    private buffer: Uint8Array;
    private readIndex: number;
    private writeIndex: number;
    private full: boolean;
    private hotThreshold: number;

    public canRead: PromiseStatus;
    private canWrite: PromiseStatus;

    constructor(buffer: Uint8Array, options?: typeof ringBufferDefaultOptions) {
        const opts = { ...ringBufferDefaultOptions, ...options };
        this.buffer = buffer;
        this.readIndex = 0;
        this.writeIndex = 0;
        this.full = false;
        this.canRead = new PromiseStatus();
        this.canWrite = new PromiseStatus();
        this.canWrite.resolve();
        this.hotThreshold = opts.hotThreshold;
    }

    get size() {
        if (this.full)
            return this.capacity;

        return (this.writeIndex - this.readIndex + this.capacity) % this.capacity;
    }

    get capacity() {
        return this.buffer.byteLength;
    }

    get bytesFree() {
        return this.capacity - this.size;
    }

    get status() {
        return {
            capacity: this.capacity,
            size: this.size,
            bytesFree: this.bytesFree,
            readIndex: this.readIndex,
            writeIndex: this.writeIndex,
            percent: (this.size * 100) / this.capacity,
            full: this.full,
        };
    }

    writeChunk(chunk: Uint8Array) {
        const view = this.buffer.subarray(this.writeIndex);

        const remaining = Math.min(this.capacity - this.writeIndex, this.bytesFree);
        const writeSize = Math.min(chunk.length, remaining);
        const leftoverSize = chunk.length - writeSize;

        view.set(chunk.subarray(0, writeSize));

        if (this.size + writeSize >= this.capacity) {
            this.full = true;
            this.canWrite.reset();
        }

        this.writeIndex = (this.writeIndex + writeSize) % this.capacity;

        if (leftoverSize > 0 || writeSize === remaining) {
            return chunk.subarray(writeSize);
        }

        return null;
    }

    async reserveWrite(maxChunkSize?: number) {
        await this.canWrite;
        const view = this.buffer.subarray(this.writeIndex);
        const free = this.bytesFree;
        const length = Math.min(maxChunkSize ?? free, free);

        const viewSize = Math.min(this.capacity - this.writeIndex, length);
        const wrapSize = length - viewSize;

        this.writeIndex = (this.writeIndex + length) % this.capacity;

        if (wrapSize > 0) {
            return {
                wrap: true,
                view,
                wrappedView: this.buffer.subarray(0, wrapSize)
            };
        }
        return { wrap: false, view }
    }

    flush() {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.canWrite.resolve();
        this.canRead.reset();
        this.full = false;
    }

    advanceRead(requestedLength: number) {
        const length = Math.min(requestedLength, this.capacity);

        if (this.size < length) {
            return 'underflow'
        }

        this.full = false;
        this.canWrite.resolve();

        this.readIndex = (this.readIndex + length) % this.capacity;
        return 'ok';
    }

    async write(requestedLength: Uint8Array) {
        let leftover = this.writeChunk(chunk);

        while (leftover !== null) {
            await this.canWrite;
            leftover = this.writeChunk(leftover);

            // Resolve canRead if enough data
            if (
                !this.canRead.isResolved &&
                    (this.size >= this.hotThreshold)
            ) {
                this.canRead.resolve();
            }
        }
    }
}
