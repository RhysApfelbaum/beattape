import { PromiseStatus } from "./promiseStatus";


type RingBufferReadResult = {
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

export class RingBuffer {
    private buffer: ArrayBuffer; 
    private size: number;
    private readIndex: number;
    private writeIndex: number;
    private fullThreshold: number;
    private hotThreshold: number;
    private emptyThreshold: number;

    capacity: number;
    loop: boolean;
    ready: PromiseStatus;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.size = 0;
        this.readIndex = 0;
        this.writeIndex = 0;
        this.fullThreshold = capacity * 0.95;
        this.hotThreshold = capacity * 0.5;
        this.emptyThreshold = capacity * 0.00;
        this.buffer = new ArrayBuffer(capacity);
        this.ready = new PromiseStatus();
        this.ready.resolve();
        this.loop = true;
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

    write(chunk: ArrayBuffer): {
        full: boolean,
        loss: boolean
    } {
        const writeView = new Uint8Array(this.buffer);
        const chunkView = new Uint8Array(chunk);


        // if (this.size + chunkView.length >= this.capacity) {
        //     return {
        //         // Chunk loss
        //         full: true,
        //         loss: true
        //     };
        // }

        // const size = this.loop ? this.writeIndex : this.size;
        // if (size + chunkView.length >= this.capacity) {
        //     // console.log('FULL')
        //     return {
        //         // Chunk loss
        //         full: true,
        //         loss: true
        //     }
        // }

        // The chunk covers the distance from the write pointer to the end of the buffer.
        const looping = this.loop && (this.writeIndex + chunkView.length >= this.capacity);

        const firstPartSize = Math.min(chunkView.length, this.capacity - this.writeIndex);

        const chunkLength = looping ? firstPartSize : chunkView.length;

        const secondPartSize = chunkView.length - firstPartSize;

        writeView.set(chunkView.subarray(0, firstPartSize), this.writeIndex);

        if (!looping && secondPartSize > 0) {
            // Discard the left-over part if we are looping, as it's probably zeros.
            writeView.set(chunkView.subarray(firstPartSize), 0);
        }

        this.writeIndex = (this.writeIndex + chunkLength) % this.capacity;
        this.size += chunkLength;

        if (this.ready.isResolved && this.size <= this.hotThreshold) {
            this.ready.resolve();
        }

        const full = this.size >= this.fullThreshold;

        return {
            full: full,
            loss: false
        };
    }

    read(requestedBytes: number): RingBufferReadResult {

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

        if (this.isFull()) {
            this.readIndex = (this.readIndex + bytes) % this.capacity;
            return result;
        } else if (this.size < bytes) {
            this.ready.reset();
            return {
                view: null,
                wrappedView: null,
                wrap: false,
                underflow: true
            }
        }

        this.readIndex = (this.readIndex + bytes) % this.capacity;
        this.size -= bytes;

        return result;
    }

    // HACK this is wildly unsafe
    seek(position: number) {
        this.readIndex = position;
    }

    flush() {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.size = 0;
    }
}

export class SizedBuffer {
    private buffer: ArrayBuffer; 
    private size: number;
    private readIndex: number;
    private writeIndex: number;
    private fullThreshold: number;
    private hotThreshold: number;
    private emptyThreshold: number;

    capacity: number;
    ready: PromiseStatus;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.size = 0;
        this.readIndex = 0;
        this.writeIndex = 0;
        this.fullThreshold = capacity * 0.95;
        this.hotThreshold = capacity * 0.5;
        this.emptyThreshold = capacity * 0.05;
        this.buffer = new ArrayBuffer(capacity);
        this.ready = new PromiseStatus();
        this.ready.resolve();
    }

    write(chunk: ArrayBuffer): {
        full: boolean,
        loss: boolean
    } {
        const writeView = new Uint8Array(this.buffer);
        const chunkView = new Uint8Array(chunk);


        if (this.size + chunkView.length >= this.capacity) return {
            // Chunk loss
            full: true,
            loss: true
        }

        writeView.set(chunkView, this.writeIndex);

        this.writeIndex = this.writeIndex + chunkView.length;
        this.size += chunkView.length;

        if (this.ready.isResolved && this.size <= this.hotThreshold) {
            this.ready.resolve();
        }

        const full = this.size >= this.fullThreshold;

        return {
            full: full,
            loss: false
        };
    }

    read(bytes: number) {
        if (this.size < bytes) {
            return {
                view: null,
                underflow: true,
            }
        };

        console.log('reading', this.readIndex);

        const result = { view: new Uint8Array(this.buffer, this.readIndex, bytes), underflow: false };
        this.readIndex += bytes;
        this.size -= bytes;

        return result;
    }

    seek(position: number) {
        this.readIndex = position;
    }
}

