import { assertNotNull, unreachable } from "./helpers";
import { PromiseStatus } from "./promiseStatus";


export type RingBufferReadResult = {
    view: Uint8Array,
    wrappedView: null,
    underflow: false,
    wrap: false
} | {
    view: null,
    wrappedView: null,
    underflow: true,
    wrap: false
} | {
    view: Uint8Array,
    wrappedView: Uint8Array,
    underflow: false,
    wrap: true
};

const BlackHole = {
    write: async (chunk: Uint8Array) => new Uint8Array()
};

export class RingBuffer {
    private buffer: ArrayBuffer | null; 
    private size: number;
    private readIndex: number;
    private writeIndex: number;
    private fullThreshold: number;
    private hotThreshold: number;
    private emptyThreshold: number;
    private loopFull: boolean;
    private locked: PromiseStatus;

    capacity: number;
    loop: boolean;
    canRead: PromiseStatus;
    canWrite: PromiseStatus;
    fresh: boolean;

    constructor(loop: boolean) {
        this.capacity = 0;
        this.size = 0;
        this.readIndex = 0;
        this.writeIndex = 0;
        this.fullThreshold = 0;
        this.hotThreshold = 0;
        this.emptyThreshold = 0;
        this.buffer = null;
        this.canRead = new PromiseStatus();
        this.canWrite = new PromiseStatus();
        this.locked = new PromiseStatus();
        this.canWrite.resolve();
        this.loop = loop;
        this.loopFull = false;
        this.fresh = true;
    }

    getStatus() {
        return {
            capacity: this.capacity,
            size: this.size,
            readIndex: this.readIndex,
            writeIndex: this.writeIndex,
            percent: this.size * 100 / this.capacity
        }
    }

    isFull() {
        return this.size >= this.capacity;
    }

    isEmpty() {
        return this.size === 0;
    }

    // Cancel any new or pending writes
    lock() {
        this.locked.resolve();
    }

    // Allow new writes
    unlock() {
        this.locked.reset();
    }

    async write(chunk: Uint8Array) {
        assertNotNull(this.buffer);

        await Promise.race([ this.locked, this.canWrite ]);

        // Completely discard the write
        if (this.locked.isResolved)
            return new Uint8Array();

        const writeView = new Uint8Array(this.buffer);
        const capacity = this.capacity;

        // Case 1: Looping mode and already full — reject all writes
        if (this.loop && this.loopFull) {
            return chunk;
        }

        const remaining = capacity - this.writeIndex;
        const firstPartSize = Math.min(chunk.length, remaining);
        const secondPartSize = chunk.length - firstPartSize;


        // Write first part
        writeView.set(chunk.subarray(0, firstPartSize), this.writeIndex);

        let totalWritten = firstPartSize;

        // Looping mode: stop at end of buffer, discard second part
        if (this.loop) {
            if (this.writeIndex + chunk.length >= capacity) {
                this.loopFull = true;
                this.writeIndex = 0;
                this.size = capacity;
                this.canWrite.reset();
                if (!this.canRead.isResolved) this.canRead.resolve();
                return chunk.subarray(firstPartSize); // discard second half
            } else {
                this.writeIndex += firstPartSize;
                this.size += firstPartSize;
            }
        }

        // Non-looping: wrap around and write second part
        else {
            if (secondPartSize > 0) {
                writeView.set(chunk.subarray(firstPartSize), 0);
                this.writeIndex = secondPartSize;
                totalWritten += secondPartSize;
            } else {
                this.writeIndex = (this.writeIndex + firstPartSize) % capacity;
            }

            this.size = Math.min(this.size + totalWritten, capacity);

            // Backpressure: full?
            if (this.size >= this.fullThreshold) {
                this.canWrite.reset();
            }
        }

        // Resolve canRead if enough data
        if (!this.canRead.isResolved && (this.loopFull || this.size >= this.hotThreshold)) {
            this.canRead.resolve();
        }

        return new Uint8Array(); // nothing left over
    }

    read(requestedBytes: number): RingBufferReadResult {
        assertNotNull(this.buffer);
        this.fresh = false;

        const bytes = Math.min(requestedBytes, this.capacity);

        const viewSize = Math.min(bytes, this.capacity - this.readIndex);
        const wrapSize = bytes - viewSize;



        const result: RingBufferReadResult = (wrapSize > 0)
            ? {
                view: new Uint8Array(this.buffer, this.readIndex, viewSize),
                wrappedView: new Uint8Array(this.buffer, 0, wrapSize),
                underflow: false,
                wrap: true
            }
            : {
                view: new Uint8Array(this.buffer, this.readIndex, viewSize),
                wrappedView: null,
                underflow: false,
                wrap: false
            }

        if (this.loopFull || this.isFull()) {
            this.readIndex = (this.readIndex + bytes) % this.capacity;
            this.fresh = false;
            return result;
        } else if (this.size < bytes) {
            this.canRead.reset();
            return {
                view: null,
                wrappedView: null,
                wrap: false,
                underflow: true
            }
        }

        this.fresh = false;
        this.readIndex = (this.readIndex + bytes) % this.capacity;

        if (!this.loopFull) {
            this.size -= bytes;
        }

        if (this.size < this.fullThreshold) {
            this.canWrite.resolve();
        }

        return result;
    }

    // HACK this is wildly unsafe
    relativeSeek(offset: number) {
        console.log(offset, this.size, this.capacity);
        if (offset > this.size) {
            return false;
        }
        if (-offset >= this.capacity - this.size) {
            return false;
        }
        this.readIndex = (this.readIndex + offset) % this.capacity;
        this.size -= offset;
        return true;
    }

    unsafeSeek(index: number) {
        this.readIndex = index;
    }

    flush() {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.size = 0;
        this.canWrite.resolve();
        this.canRead.reset();
    }

    allocate(bytes: number, hotThreshold: number) {
        this.buffer = new ArrayBuffer(bytes);
        this.capacity = bytes;
        this.fullThreshold = this.capacity * 0.8;
        this.hotThreshold = Math.min(48000 * 2 * 2 * 2, this.capacity);
        this.emptyThreshold = this.capacity * 0.00;
    }

    free() {
        this.buffer = null;
    }

    async pipe(target: RingBuffer | typeof BlackHole = BlackHole, requestedBytes: number, process = async (view: Uint8Array) => view, processedOffset = 0) {
        await this.canRead;
        const { view, wrappedView, wrap, underflow } = this.read(requestedBytes);
        if (underflow) {
            unreachable();
        }

        let bytesRead = view.length;

        const processedView = await process(view);
        let totalLength = processedView.length;

        const processedOffsetInWrap = processedView.length < processedOffset;
 
        let leftover = new Uint8Array();

        if (!processedOffsetInWrap) {
            leftover = await target.write(
                processedView.subarray(
                    processedOffsetInWrap ? 0 : processedOffset
                )
            );
        }

        if (leftover.length > 0 || !wrap) {
            return { leftover: leftover, bytesWritten: totalLength - leftover.length, bytesRead: bytesRead };
        }

        bytesRead += wrappedView.length;

        // view was fully written and we have a wrappedView to write
        const processedWrapped = await process(wrappedView);
        const processedWrapOffset = processedOffsetInWrap ? (processedOffset - processedView.length) : 0;
        totalLength += processedWrapped.length;
        return {
            leftover: await target.write(processedWrapped.subarray(processedWrapOffset)),
            bytesWritten: totalLength - leftover.length,
            bytesRead: bytesRead
        };
    }
}
