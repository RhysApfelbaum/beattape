import { PromiseStatus } from "./promiseStatus";


class ChunkBatcher {
    private buffer: Uint8Array;
    private size: number;
    private offset: number;

    constructor(size: number) {
        this.buffer = new Uint8Array(size);
        this.size = size;
        this.offset = 0;
    }

    enqueue(chunk: Uint8Array, controller: TransformStreamDefaultController<Uint8Array>) {
        if (chunk.length > this.size) {
            // If incoming chunk is already large, flush buffer first then pass chunk through
            this.flush(controller);
            controller.enqueue(chunk);
            return;
        }

        if (this.offset + chunk.length > this.size) {
            // Buffer full, flush it
            this.flush(controller);
        }

        // Copy chunk into buffer
        this.buffer.set(chunk, this.offset);
        this.offset += chunk.length;

        // If buffer reached threshold, flush it
        if (this.offset === this.size) {
            this.flush(controller);
        }
    }

    flush(controller: TransformStreamDefaultController<Uint8Array>) {
        if (this.offset === 0) return
        controller.enqueue(this.buffer.subarray(0, this.offset));
        this.offset = 0;
    }
}

export const chunkBatcher = () => {
    const batcher = new ChunkBatcher(16384);
    return new TransformStream<Uint8Array, Uint8Array>({
        transform: (chunk, controller) => {
            batcher.enqueue(chunk, controller);
        },
        flush: (controller) => {
            batcher.flush(controller);
        }
    });
};

export class StereoSampleQueue {
    private left: ChunkedQueue;
    private right: ChunkedQueue;
    constructor(capacity: number) {
        this.left = new ChunkedQueue(capacity);
        this.right = new ChunkedQueue(capacity);
    }

    async add(left: Float32Array, right: Float32Array) {
        const [ leftSize, rightSize ] = await Promise.all([
            this.left.add(left),
            this.right.add(right)
        ]);

        return leftSize + rightSize;
    }

    retrieve(requestedSize: number) {
        const left = this.left.retrieve(requestedSize);
        const right = this.right.retrieve(requestedSize);
        return {
            left: left.values,
            right: right.values,
            retrievedSize: Math.min(left.retrievedSize, right.retrievedSize),
            underRead: left.underRead || right.underRead
        };
    }
}

export class ChunkedQueue {
    private queue: Float32Array[];
    private size: number;
    private capacity: number;
    private canWrite: PromiseStatus;
    private canRead: PromiseStatus;
    private intendedWriteSize: number;

    constructor(capacity: number) {
        this.queue = [];
        this.size = 0;
        this.capacity = capacity;
        this.canWrite = new PromiseStatus();
        this.canRead = new PromiseStatus();
        this.intendedWriteSize = 0;
        this.canWrite.resolve();
    }

    async add(chunk: Float32Array) {
        this.intendedWriteSize = chunk.length;
        if (this.intendedWriteSize > this.capacity - this.size) {
            this.canWrite.reset();
        }
        await this.canWrite;

        this.queue.unshift(chunk);
        this.size += chunk.length;

        if (this.size > this.capacity / 3) {
            this.canRead.resolve();
        }
        
        return this.size;
    }

    retrieve(requestedSize: number) {
        const underRead = requestedSize > this.size;
        let retrievedSize = 0;
        const retrievedChunks: Float32Array[] = [];

        while (retrievedSize < requestedSize && this.queue.length > 0) {
            const chunk = this.queue.pop()!;
            const remaining = requestedSize - retrievedSize;
            if (chunk.length <= remaining) {
                retrievedChunks.push(chunk);
                retrievedSize += chunk.length;
                this.size -= chunk.length;
            } else {
                // Split the chunk
                const head = chunk.subarray(0, remaining);
                const tail = chunk.subarray(remaining);
                retrievedChunks.push(head);
                this.queue.push(tail); // put the rest back
                retrievedSize += head.length;
                this.size -= head.length;
                // break;
            }
        }

        if (this.intendedWriteSize <= this.capacity - this.size) {
            this.canWrite.resolve();
        }

        if (underRead) {
            this.canRead.reset();
        }

        return {
            values: this.concatChunks(retrievedChunks, retrievedSize),
            retrievedSize: retrievedSize,
            underRead: underRead
        };
    }

    private concatChunks(chunks: Float32Array[], totalLength: number): Float32Array {
        const result = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }
}

