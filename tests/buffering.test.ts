import { describe, it, expect } from 'bun:test';
import { LoopBuffer, RingBuffer, Sink } from '../src/fmod/buffering';

function makeChunk(size: number, fill = 1): Uint8Array {
    return new Uint8Array(Array(size).fill(fill));
}

describe('LoopBuffer', () => {
    it('allocates and frees', () => {
        const buf = new LoopBuffer();
        buf.allocate(16);

        expect(buf.status.capacity).toBe(16);
        expect(buf.isFull()).toBe(false);

        buf.free();
        expect(buf.status.capacity).toBe(0);
    });

    it('writes and reads without wrapping', async () => {
        const buf = new LoopBuffer();
        buf.allocate(8);

        const leftover = await buf.write(makeChunk(11, 7));
        expect(leftover.length).toBe(3);
        expect(buf.status.size).toBe(8);
        expect(buf.status.full).toBe(true);

        const res = buf.read(4);
        expect(res.underflow).toBe(false);
        expect(res.view?.length).toBe(4);
        expect(res.view?.[0]).toBe(7);
        expect(buf.status.size).toBe(8);
        expect(buf.status.full).toBe(true);
    });

    it('handles underflow', () => {
        const buf = new LoopBuffer();
        buf.allocate(4);

        const res = buf.read(4);
        expect(res.underflow).toBe(true);
    });

    it('wraps correctly', async () => {
        const buf = new LoopBuffer();
        buf.allocate(4);

        await buf.write(makeChunk(4, 3));
        expect(buf.isFull()).toBe(true);

        const res = buf.read(4);
        expect(res.wrap).toBe(false);
        expect(res.view?.length).toBe(4);
    });

    it('flush resets buffer', async () => {
        const buf = new LoopBuffer();
        buf.allocate(8);

        await buf.write(makeChunk(4));
        expect(buf.status.size).toBe(4);

        buf.flush();
        expect(buf.status.size).toBe(0);
    });
});

describe('RingBuffer', () => {
    it('allocates and frees', () => {
        const rb = new RingBuffer();
        rb.allocate(16);
        expect(rb.status.capacity).toBe(16);

        rb.free();
        expect(rb.canWrite.isResolved).toBe(false);
    });

    it('consume waits for space', async () => {
        const rb = new RingBuffer();
        rb.allocate(8);
        const p = rb.consume(makeChunk(16, 5));
        // Free up space after a tick
        setTimeout(() => {
            rb.read(8); // or however you consume from the buffer
        }, 10);
        await p; // now it will resolve
        expect(rb.status.size).toBe(8);
    });

    it('resolves canWrite when below threshold', async () => {
        const rb = new RingBuffer();
        rb.allocate(8);

        await rb.write(makeChunk(8));
        expect(rb.status.size).toBe(8);

        rb.read(4);
        expect(rb.status.size).toBe(4);
        expect(rb.canWrite.isResolved).toBe(true);
    });

    it('handles wrap-around writes', async () => {
        const rb = new RingBuffer();
        rb.allocate(4);

        await rb.write(makeChunk(4, 9));
        const res = rb.read(2);

        expect(res.view?.length).toBe(2);

        // write again, should wrap
        await rb.write(makeChunk(2, 7));
        expect(rb.status.size).toBe(4);
    });

    it('flush clears data and allows writes', async () => {
        const rb = new RingBuffer();
        rb.allocate(8);

        await rb.write(makeChunk(8));
        expect(rb.isFull()).toBe(true);

        rb.flush();
        expect(rb.status.size).toBe(0);
        expect(rb.canWrite.isResolved).toBe(true);
    });



    it('does not discard data when buffer fills and wraps', async () => {
        const capacity = 10;
        const rb = new RingBuffer();
        rb.allocate(capacity);

        // Step 1: write 7 bytes
        let leftover = await rb.write(makeChunk(7, 1));
        expect(leftover.length).toBe(0);

        // Step 2: destructive read 5 bytes
        const read = rb.read(5);
        expect(read.view?.length).toBe(5);

        // Step 3: write 8 bytes (forces wrap)
        leftover = await rb.write(makeChunk(8, 2));

        // Check that nothing was discarded
        expect(leftover.length).toBe(0);

        // The buffer size should be 10 (full)
        expect(rb.status.size).toBe(capacity);
        expect(rb.status.full).toBe(true);

        // Read everything out and make sure we get the exact sequence of bytes
        const result: number[] = [];
        while (rb.status.size > 0) {
            const r = rb.read(1);
            if (r.view) result.push(...r.view);
        }

        // First 2 bytes from leftover read
        expect(result).toEqual([1,1,2,2,2,2,2,2,2,2]);

    });
});

describe('Sink', () => {
    it('fills up to capacity', () => {
        const sink = new Sink(4);

        const leftover = sink.write(makeChunk(6, 2));
        expect(leftover.length).toBe(2);
        expect(sink.isFull()).toBe(true);
    });

    it('accepts exact capacity', () => {
        const sink = new Sink(4);

        const leftover = sink.write(makeChunk(4, 1));
        expect(leftover.length).toBe(0);
        expect(sink.isFull()).toBe(true);
    });
});
