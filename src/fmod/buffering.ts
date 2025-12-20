import { makeOptions } from '../utilities/options';
import { assertNotNull, dbg, resolveOnAbort, unreachable } from './helpers';
import { PromiseStatus } from './promiseStatus';



interface WritableBuffer {
    write: (chunk: Uint8Array) => Promise<Uint8Array> | Uint8Array;
}

export class Sink implements WritableBuffer {
    private capacity: number;
    private size: number;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.size = 0;
    }

    write(chunk: Uint8Array) {
        const remaining = this.capacity - this.size;
        const writeSize = Math.min(remaining, chunk.length);
        this.size += writeSize;

        if (writeSize < chunk.length) {
            return chunk.subarray(writeSize);
        }
        return new Uint8Array();
    }

    isFull() {
        return this.size >= this.capacity;
    }
}

class WrappedBufferView {
    buffer: ArrayBuffer | null;
    capacity: number;
    readIndex: number;
    writeIndex: number;
    private full: boolean;

    destructiveRead: boolean;

    constructor() {
        this.buffer = null;
        this.capacity = 0;
        this.readIndex = 0;
        this.writeIndex = 0;
        this.full = false;
        this.destructiveRead = false;
    }

    get size() {
        if (this.full)
            return this.capacity;

        return (this.writeIndex - this.readIndex + this.capacity) % this.capacity;
    }

    forceFull() {
        this.full = true;
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

    allocate(capacity: number) {
        if (this.buffer !== null) {
            throw new Error('Tried allocate a buffer that has already been allocated');
        }
        this.buffer = new ArrayBuffer(capacity);
        this.capacity = capacity;
    }

    free() {
        dbg('freeing');
        if (this.buffer === null) {
            throw new Error('Tried to free an unallocated buffer');
        }
        this.flush();
        this.buffer = null;
        this.capacity = 0;
    }

    write(chunk: Uint8Array) {
        assertNotNull(this.buffer, 'Buffer not allocated');

        const view = new Uint8Array(this.buffer, this.writeIndex);

        const remaining = Math.min(this.capacity - this.writeIndex, this.bytesFree);
        const writeSize = Math.min(chunk.length, remaining);
        const leftoverSize = chunk.length - writeSize;

        view.set(chunk.subarray(0, writeSize));

        if (this.size + writeSize >= this.capacity) {
            this.full = true;
        }

        this.writeIndex = (this.writeIndex + writeSize) % this.capacity;

        if (leftoverSize > 0 || writeSize === remaining) {
            return {
                wrapped: true,
                leftover: chunk.subarray(writeSize)
            };
        }


        return {
            wrapped: false,
            leftover: new Uint8Array()
        };
    }

    flush() {
        this.readIndex = 0;
        this.writeIndex = 0;
        this.full = false;
    }

    read(requestedBytes: number): ReadResult {
        assertNotNull(this.buffer, 'Buffer not allocated');

        const bytes = Math.min(requestedBytes, this.capacity);

        const viewSize = Math.min(bytes, this.capacity - this.readIndex);
        const wrapSize = bytes - viewSize;

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

        if (this.size < bytes) {
            return {
                view: null,
                wrappedView: null,
                wrap: false,
                underflow: true,
            };
        }

        if (this.destructiveRead) {
            this.full = false;
        }

        this.readIndex = (this.readIndex + bytes) % this.capacity;
        return result;
    }

}


export class LoopBuffer {
    protected view: WrappedBufferView;
    protected locked: PromiseStatus;

    private hotThreshold: number;
    private id: string;
    private debug: boolean;

    static defaultPipeOptions = {
        process: async (view: Uint8Array) => view,
        processedOffset: 0,
        debug: false,
        signal: new AbortController().signal
    }

    static defaultOptions = {
        hotThreshold: 0,
        id: '',
        debug: false
    }

    canRead: PromiseStatus;
    fresh: boolean;

    constructor(
        options: Partial<typeof LoopBuffer.defaultOptions> = LoopBuffer.defaultOptions
    ) {
        const { hotThreshold, debug, id } = {
            ...LoopBuffer.defaultOptions,
            ...options
        };
        this.view = new WrappedBufferView();
        this.canRead = new PromiseStatus();
        this.locked = new PromiseStatus();
        this.hotThreshold = hotThreshold;
        this.debug = debug;

        if (id) {
            this.id = id;
        } else {
            this.id = Math.random().toString(36).slice(2);
        }

        this.fresh = true;
    }

    isFull() {
        return this.status.full;
    }

    get isAllocated() {
        return this.view.buffer !== null;
    }

    lock() {
        this.locked.resolve();
    }

    unlock() {
        this.locked.reset();
    }

    get status() {
        return this.view.status;
    }

    flush() {
        this.canRead.reset();
        this.view.flush();
    }

    allocate(capacity: number) {
        this.view.allocate(capacity);
        this.hotThreshold = Math.min(this.hotThreshold, capacity);
        this.unlock();
    }

    free() {
        this.canRead.reset();
        this.lock();
        this.view.free();
        this.fresh = true;
    }

    read(requestedBytes: number) {
        this.fresh = false;
        const result = this.view.read(requestedBytes);

        if (result.underflow || this.status.size < this.hotThreshold) {
            this.canRead.reset();
        }

        if (this.debug) {
            dbg('read', requestedBytes, this.id, this.status);
        }

        return result;
    }

    async write(chunk: Uint8Array, signal: AbortSignal | null = null) {
        if (this.locked.isResolved) {
            return new Uint8Array();
        }

        const preWrite = this.status;

        const { leftover, wrapped } = this.view.write(chunk);

        if (wrapped && !this.view.destructiveRead) {
            this.view.forceFull();
            if (this.debug) {
                dbg('wrapped', preWrite, chunk.length, this.id, this.status);
            }
        }

        if (this.debug) {
            dbg('write', chunk.length, this.id, this.status);
        }

        // Resolve canRead if enough data
        if (
            !this.canRead.isResolved &&
            (this.view.size >= this.hotThreshold)
        ) {
            this.canRead.resolve();
            if (this.debug) {
                dbg('resolving canRead', this.status);
            }
        }

        return leftover;
    }

    unsafeSeek(index: number) {
        assertNotNull(this.view.buffer, 'Buffer not allocated');
        this.view.readIndex = index;
    }

    async pipe(
        target: WritableBuffer,
        requestedBytes: number,
        options: Partial<typeof LoopBuffer.defaultPipeOptions> = {}
    ) {
        const { process, processedOffset, debug, signal } = {
            ...LoopBuffer.defaultPipeOptions,
            ...options,
        };

        await Promise.race([
            this.canRead,
            resolveOnAbort(signal)
        ]);


        if (signal.aborted) {
            return {
                leftover: new Uint8Array(),
                bytesWritten: 0,
                bytesRead: 0,
            };
        }

        const debugCanReadResolved = this.canRead.isResolved;

        const { view, wrappedView, wrap, underflow } =
            this.read(requestedBytes);
        if (underflow) {
            console.error('canRead is resolved:', debugCanReadResolved);
            console.error(this.status);
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
                    processedOffsetInWrap ? 0 : processedOffset,
                ),
            );
        }

        if (debug) {
            dbg('processed data', processedView);
            dbg(this.status);
        }

        if (leftover.length > 0 || !wrap) {
            return {
                leftover: leftover,
                bytesWritten: totalLength - leftover.length,
                bytesRead: bytesRead,
            };
        }

        bytesRead += wrappedView.length;


        // view was fully written and we have a wrappedView to write
        const processedWrapped = await process(wrappedView);
        const processedWrapOffset = processedOffsetInWrap
            ? processedOffset - processedView.length
            : 0;
        totalLength += processedWrapped.length;
        return {
            leftover: await target.write(
                processedWrapped.subarray(processedWrapOffset),
            ),
            bytesWritten: totalLength - leftover.length,
            bytesRead: bytesRead,
        };
    }
}

export class RingBuffer extends LoopBuffer {
    canWrite: PromiseStatus;
    private fullThreshold;

    constructor(options: { hotThreshold: number }) {
        super(options);
        this.fullThreshold = 0;
        this.canWrite = new PromiseStatus();

        // It's now possible to overwrite bytes that have been read
        this.view.destructiveRead = true;
    }

    allocate(capacity: number) {
        this.fullThreshold = capacity * 0.8;
        this.canWrite.resolve();
        super.allocate(capacity);
    }

    free() {
        this.canWrite.reset();
        super.free();
    }

    async write(chunk: Uint8Array, signal: AbortSignal | null = null) {
        let leftover = chunk;

        while (leftover.length > 0) {
            await Promise.race([this.canWrite, this.locked]);

            // If the buffer was locked, abort the write
            if (this.locked.isResolved) {
                return new Uint8Array();
            }

            leftover = await super.write(leftover);
            if (this.status.full) {
                this.canWrite.reset();
            }
        }

        return new Uint8Array();
    }

    read(requestedBytes: number) {
        const result = super.read(requestedBytes);
        if (this.view.size < this.fullThreshold) {
            this.canWrite.resolve();
        }
        return result;
    }

    flush() {
        super.flush();
        this.canWrite.resolve();
    }
}

export type ReadResult =
    | {
          view: Uint8Array;
          wrappedView: null;
          underflow: false;
          wrap: false;
      }
    | {
          view: null;
          wrappedView: null;
          underflow: true;
          wrap: false;
      }
    | {
          view: Uint8Array;
          wrappedView: Uint8Array;
          underflow: false;
          wrap: true;
      };
