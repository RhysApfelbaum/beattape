class PCMProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const input = inputs[0];
        if (input.length >= 2) {
            const left = input[0];
            const right = input[1];
            const length = left.length;

            // Create Int16Array for interleaved stereo output
            const int16Buffer = new Int16Array(length * 2);

            for (let i = 0; i < length; i++) {
                // Clamp float sample to [-1, 1] and convert to 16-bit PCM
                int16Buffer[i * 2] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF;
                int16Buffer[i * 2 + 1] = Math.max(-1, Math.min(1, right[i])) * 0x7FFF;
            }

            this.port.postMessage(int16Buffer.buffer);
        } else if (input.length === 1) {
            // Mono case
            const mono = input[0];
            const int16Buffer = new Int16Array(mono.length);
            for (let i = 0; i < mono.length; i++) {
                int16Buffer[i] = Math.max(-1, Math.min(1, mono[i])) * 0x7FFF;
            }
            this.port.postMessage(int16Buffer);
        }
        return true;
    }
}

registerProcessor('pcm-processor', PCMProcessor);
