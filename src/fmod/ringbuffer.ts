import { ReadResult } from "./buffering";
import { PromiseStatus } from "./promiseStatus";


const ringBufferDefaultOptions = {
    hotThreshold: 1000
};

export class RingBuffer {
    private buffer: ArrayBufferLike;
    private readIndex: number;
    private writeIndex: number;
    private full: boolean;
    private hotThreshold: number;

    public canRead: PromiseStatus;
    public canWrite: PromiseStatus;

    constructor(buffer: ArrayBufferLike, options?: typeof ringBufferDefaultOptions) {
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
        const view = new Uint8Array(this.buffer, this.writeIndex);

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

    flush() {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.canWrite.resolve();
        this.canRead.reset();
        this.full = false;
    }

    read(requestedLength: number): ReadResult {
        const length = Math.min(requestedLength, this.capacity);

        const viewSize = Math.min(length, this.capacity - this.readIndex);
        const wrapSize = length - viewSize;


        if (this.size < length) {
            return {
                view: null,
                wrappedView: null,
                wrap: false,
                underflow: true,
            };
        }

        const result: ReadResult =
            wrapSize > 0
                ? {
                      view: new Uint8Array(
                          this.buffer,
                          this.readIndex,
                          viewSize,
                      ),
                      wrappedView: new Uint8Array(this.buffer, 0, wrapSize),
                      underflow: false,
                      wrap: true,
                  }
                : {
                      view: new Uint8Array(
                          this.buffer,
                          this.readIndex,
                          viewSize,
                      ),
                      wrappedView: null,
                      underflow: false,
                      wrap: false,
                  };

        this.full = false;
        this.canWrite.resolve();

        this.readIndex = (this.readIndex + length) % this.capacity;
        return result;
    }

    async write(chunk: Uint8Array) {
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
