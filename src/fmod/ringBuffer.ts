import { PromiseStatus } from "./promiseStatus";

export class ChunkedQueue {
    private queue: Float32Array[];
    private size: number;
    private capacity: number;
    private canWrite: PromiseStatus;
    private intendedWriteSize: number;

    constructor(capacity: number) {
        this.queue = [];
        this.size = 0;
        this.capacity = capacity;
        this.canWrite = new PromiseStatus();
        this.intendedWriteSize = 0;
        this.canWrite.resolve();
    }

    async add(chunk: Float32Array) {
        this.intendedWriteSize = chunk.length;
        // console.log('intendedwritesize', this.intendedWriteSize, this.capacity - this.size);
        if (this.intendedWriteSize > this.capacity - this.size) {
            this.canWrite.reset();
        }
        await this.canWrite;

        this.queue.unshift(chunk);
        this.size += chunk.length;
        console.log('size', this.size);
    }

    retrieve(requestedSize: number) {
        console.log('buffer size', this.size, requestedSize);
        if (requestedSize > this.size) return null;

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
                break;
            }
        }


        if (this.intendedWriteSize <= this.capacity - this.size) {
            this.canWrite.resolve();
        }

        return this.concatChunks(retrievedChunks, retrievedSize);
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

// export class Float32RingBuffer {
//     private readIndex: number;
//     private writeIndex: number;
//     private intendedWriteSize: number;
//     private buffer: Float32Array;
//     private canWrite: PromiseStatus;
//
//     constructor(capacity: number) {
//         this.readIndex = 0;
//         this.writeIndex = 0;
//         this.intendedWriteSize = 0;
//         this.buffer = new Float32Array(capacity);
//         this.canWrite = new PromiseStatus();
//     }
//
//     get capacity() {
//         return this.buffer.length;
//     }
//
//     get size() {
//         if (this.writeIndex > this.readIndex) return this.writeIndex - this.readIndex;
//         return this.writeIndex + this.capacity - this.readIndex;
//     }
//
//     get freeSpace() {
//         return this.capacity - this.size;
//     }
//
//     private resolveDeferredWriteIfReady() {
//         if (this.canWrite.isResolved) return;
//         if (this.size >= this.intendedWriteSize) {
//             this.canWrite.resolve();
//         }
//     }
//
//     private slice(start: number, length: number) {
//         const result = new Float32Array(length);
//         for (let i = 0; i < length; i++) {
//             result[i] = this.buffer[(start + i) % this.capacity];
//         }
//         return result;
//     }
//
//     write(buffer: Float32Array) {
//         const valuesToWrite = Math.min(buffer.length, this.freeSpace);
//         for (let i = 0; i < valuesToWrite; i++) {
//             this.buffer[(this.writeIndex + i) % this.capacity] = buffer[i];
//         }
//         this.writeIndex += valuesToWrite;
//         this.writeIndex %= this.capacity;
//         return {
//             leftoverData: (valuesToWrite < buffer.length)
//                 ? buffer.slice(valuesToWrite)
//                 : null
//         };
//     }
//
//     async feed(buffer: Float32Array) {
//         let data = buffer;
//         while (true) {
//             const { leftoverData } = await this.deferWrite(data);
//             if (leftoverData === null) break;
//             data = leftoverData;
//         }
//     }
//
//     async deferWrite(buffer: Float32Array) {
//         this.intendedWriteSize = buffer.length;
//         this.canWrite = new PromiseStatus();
//         this.resolveDeferredWriteIfReady();
//         await this.canWrite;
//         return this.write(buffer);
//     }
//
//
//     read(length: number): {
//         values: Float32Array,
//         underRead: boolean
//     } {
//         this.resolveDeferredWriteIfReady();
//
//         const start = this.readIndex;
//         const readLength = Math.min(length, this.size);
//         this.readIndex = (this.readIndex + readLength) % this.capacity;
//
//         return {
//             values: this.slice(start, readLength),
//             underRead: readLength < length
//         };
//     }
// }
