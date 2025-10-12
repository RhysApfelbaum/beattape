import { LoopBuffer, RingBuffer, Sink } from './buffering';
import { FMODMountedFile } from './mountedFile';
import { Pointer } from './pointer';
import { FMOD } from './system';
import { assertNotNull } from './helpers';
import { PromiseStatus } from './promiseStatus';

import { OggVorbisDecoderWebWorker } from '@wasm-audio-decoders/ogg-vorbis';

const DEFAULT_SOUND_INFO = {
    sampleRate: 48000,
    numChannels: 2,
    bytesPerSample: 2,
    get bytesPerSecond() {
        return this.bytesPerSample * this.sampleRate * this.numChannels;
    },
};

export interface RemoteSound {
    handle: any;
    start: number;
    end: number;
    isLoaded: boolean;
    fetch: () => Promise<void>;
    unload: () => Promise<void>;
    release: () => void;
}

export class StreamedSound implements RemoteSound {
    private fileBuffer: LoopBuffer;
    private startBuffer: LoopBuffer;
    private decodeBuffer: RingBuffer;
    private decoder: OggVorbisDecoderWebWorker | null;
    private soundInfo: typeof DEFAULT_SOUND_INFO;
    private seekPosition: number;
    private decodePosition: number;
    private decodeBufferStartPosition: number;
    private decodeChunk: (chunk: Uint8Array) => Promise<Uint8Array>;
    private startThreshold: number;
    private readCallbackLastCalled: number;
    private timelinePosition: number;

    private currentSeekAbort: AbortController;

    private decoding: boolean;
    private decodingStatus: PromiseStatus;

    private static DECODE_CHUNK_SIZE = 4096;
    private static DECODE_BUFFER_SECONDS = 10;

    url: string;
    handle: any;
    start: number;
    end: number;
    length: number;
    stop: () => void;
    restart: () => void;

    constructor(
        url: string,
        start: number,
        end: number,
        length: number,
        sampleRate: number,
        onStop = () => {},
        onRestart = () => {},
    ) {
        this.start = start;
        this.end = end;
        this.stop = onStop;
        this.restart = onRestart;
        this.url = url;
        this.soundInfo = DEFAULT_SOUND_INFO;
        this.soundInfo.sampleRate = Math.round(sampleRate);
        this.length = length;

        this.fileBuffer = new LoopBuffer({
            hotThreshold: StreamedSound.DECODE_CHUNK_SIZE * 4
        });

        // Wait for 2 seconds of decoded audio before reading
        const decodedHot = this.soundInfo.bytesPerSecond * 2;

        this.startBuffer = new LoopBuffer({ hotThreshold: decodedHot });
        this.decodeBuffer = new RingBuffer({ hotThreshold: decodedHot });


        // Always keep the first 4 seconds of decoded audio in memory
        this.startThreshold = this.soundInfo.bytesPerSecond * 4;

        this.decodePosition = 0; // Measured in SAMPLES!!!!!
        this.seekPosition = 0;
        this.decodeBufferStartPosition = this.startThreshold;
        this.decoder = null;
        this.decoding = true;
        this.decodingStatus = new PromiseStatus();
        this.decodingStatus.resolve();
        this.readCallbackLastCalled = 0;
        this.timelinePosition = 0;

        this.currentSeekAbort = new AbortController();

        this.decodeChunk = async chunk => {
            assertNotNull(this.decoder);
            const { channelData, samplesDecoded, errors } =
                await this.decoder.decode(chunk);
            const [left, right] = channelData;

            if (errors.length > 0 || samplesDecoded < 0) {
                this.stop();
                throw new Error(`Decoding error. samplesDecoded: ${samplesDecoded}, errors: ${JSON.stringify(errors) ?? 'none'}, channelData: ${JSON.stringify(channelData) ?? 'none'}`);
            }

            // Discard samples that overshoot the theoretical limit
            const sampleCount = this.soundInfo.sampleRate * this.length;
            const remainingSamples = sampleCount - this.decodePosition;
            const length = Math.min(samplesDecoded, remainingSamples);

            if (length === 0) {
                // console.log(channelData);
            }

            this.decodePosition = (this.decodePosition + length) % sampleCount;

            // Create Int16Array for interleaved stereo output
            const int16Buffer = new Int16Array(length * 2);

            // TODO Maybe there's a clever way to sort out the floats
            for (let i = 0; i < length; i++) {
                // Clamp float sample to [-1, 1] and convert to 16-bit PCM
                int16Buffer[i * 2] =
                    Math.max(-1, Math.min(1, left[i])) * 0x7fff;
                int16Buffer[i * 2 + 1] =
                    Math.max(-1, Math.min(1, right[i])) * 0x7fff;
            }
            return new Uint8Array(int16Buffer.buffer);
        };
    }

    underflow() {
        this.stop();
        setTimeout(() => this.restart(), 1000);
    }

    private async download() {
        const response = await fetch(this.url);

        assertNotNull(this.decoder); // Sanity check
        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${this.url}: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.body) {
            throw new Error(`Failed to fetch ${this.url}: No response body`);
        }

        if (response.type === 'error') {
        }

        const lengthHeader = response.headers.get('Content-Length');
        if (!lengthHeader) {
            throw new Error(
                `No Content-Length header in response from ${this.url}`,
            );
        }

        const fileLength = Number(lengthHeader);

        if (!Number.isFinite(fileLength) || fileLength < 0) {
            throw new Error(`Invalid Content-Length value: "${lengthHeader}"`);
        }

        this.fileBuffer.allocate(fileLength);

        const reader = response.body.getReader({ mode: 'byob' });

        let chunkBuffer = new ArrayBuffer(StreamedSound.DECODE_CHUNK_SIZE);
        while (true) {
            const view = new Uint8Array(chunkBuffer);
            const { done, value } = await reader.read(view);
            if (done) {
                break;
            }
            await this.fileBuffer.write(value);
            chunkBuffer = value.buffer as ArrayBuffer;
        }
        console.debug(this.fileBuffer.status);
    }

    private async startDecoding(start: boolean) {
        let atStart = start;
        this.decoding = true;
        this.decodingStatus.reset();
        while (this.decoding) {
            const buffer = atStart ? this.startBuffer : this.decodeBuffer;
            const { leftover } = await this.fileBuffer.pipe(
                buffer,
                StreamedSound.DECODE_CHUNK_SIZE,
                { process: this.decodeChunk }
            );
            if (this.url.includes('deep_kick')) {
                // console.log('writing', buffer.status, leftover.length, atStart); 
            }

            if (leftover.length > 0) {
                if (atStart) {
                    atStart = false;
                    this.startBuffer.lock();
                }
                await this.decodeBuffer.write(leftover);
            }
        }
        this.decodingStatus.resolve();
    }

    private async stopDecoding() {
        this.decoding = false;
        this.decodeBuffer.lock();
        this.decodeBuffer.unlock();
        await this.decodingStatus;
    }

    updateTime(seconds: number) {
        this.timelinePosition =
            (seconds - this.start) * this.soundInfo.bytesPerSecond;
    }

    async fetch() {
        this.decoder = new OggVorbisDecoderWebWorker();

        this.decodeBuffer.allocate(
            this.soundInfo.bytesPerSecond * StreamedSound.DECODE_BUFFER_SECONDS
        );

        this.startBuffer.allocate(this.startThreshold);

        // Start downloading the file
        this.download();

        await Promise.all([this.fileBuffer.canRead, this.decoder.ready]);


        // Start the decoding producer
        this.startDecoding(true);
    }

    get isLoaded() {
        return this.handle !== null && this.handle !== undefined;
    }

    private readPCMFromStart(heapPointer: number, requestedBytes: number) {
        const { capacity } = this.startBuffer.status;
        const { wrap, view, wrappedView, underflow } = this.startBuffer.read(
            Math.min(requestedBytes, capacity),
        );

        if (underflow) {
            console.error(this.url, 'start underflow');
            this.stop();
            this.startBuffer.canRead.then(() => this.restart());
            return;
        }

        FMOD.HEAPU8.set(view, heapPointer);
        // this.advanceSeekPosition(view.length);

        if (wrap) {
            /*
             * We've read through the whole start buffer, so we attempt to get
             * the remaining bytes from the decode buffer
             */
            this.readPCM(heapPointer + view.length, wrappedView.length);
        }
    }

    private readPCM(heapPointer: number, requestedBytes: number) {
        if (this.url.includes('deep_kick')) {
            // console.log('reading', this.decodeBuffer.status); 
        }
        const { capacity } = this.decodeBuffer.status;
        const { wrap, view, wrappedView, underflow } = this.decodeBuffer.read(
            Math.min(requestedBytes, capacity),
        );

        if (underflow) {
            console.error(this.url, 'underflow');
            this.stop();
            this.decodeBuffer.canRead.then(() => this.restart());
            return;
        }

        FMOD.HEAPU8.set(view, heapPointer);

        this.decodeBufferStartPosition =
            this.decodeBufferStartPosition + view.length;

        if (wrap) {
            FMOD.HEAPU8.set(wrappedView, heapPointer + view.length);
            this.decodeBufferStartPosition += wrappedView.length;
        }

        this.decodeBufferStartPosition %=
            this.soundInfo.bytesPerSecond * this.length;
    }

    async forceSeekDecodeBuffer(position: number) {
        // console.debug('force seeking', this.url);
        await this.stopDecoding();

        assertNotNull(this.decoder);

        // Restart the file buffer
        this.fileBuffer.unsafeSeek(0);

        // Reset the decoder to process a new audio stream
        await this.decoder.reset();

        this.decodePosition = 0;

        this.decodeBuffer.flush();
        const sink = new Sink(position);
        let leftover = new Uint8Array();
        // console.debug(this.fileBuffer.status);
        console.debug(this.url, 'starting sink', this.fileBuffer.status);
        while (!sink.isFull()) {

            if (this.currentSeekAbort.signal.aborted) {
                // console.debug('seek cancelled', this.fileBuffer.status);
                this.fileBuffer.unsafeSeek(0);
                return;
            }

            const result = await this.fileBuffer.pipe(
                sink,
                StreamedSound.DECODE_CHUNK_SIZE,
                { process: this.decodeChunk, debug: false, }
            );


            leftover = result.leftover;
        }

        console.debug(this.url, 'ending sink');
        // console.debug(this.fileBuffer.status);

        if (leftover.length > 0) {
            await this.decodeBuffer.write(leftover);
        }

        this.decodeBufferStartPosition = position;
        this.startDecoding(false);
    }

    async load() {
        assertNotNull(this.fileBuffer, 'file buffer is not initialised');
        await this.startBuffer.canRead;

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        const { sampleRate, numChannels } = this.soundInfo;

        info.length = this.length * this.soundInfo.bytesPerSecond;
        info.numchannels = numChannels;
        info.defaultfrequency = sampleRate;
        info.decodebuffersize = sampleRate;
        info.format = FMOD.SOUND_FORMAT_PCM16;

        info.pcmsetposcallback = (
            _sound: any,
            _subsound: any,
            position: number,
            _postype: any,
        ) => {
            const { bytesPerSample, numChannels } = this.soundInfo;
            const bytePosition = position * bytesPerSample * numChannels;

            console.debug('seeking', this.url, position, this.currentSeekAbort.signal.aborted);
            this.seek(bytePosition);
            return FMOD.OK;
        };

        info.pcmreadcallback = (sound: any, data: number, datalen: number) => {


            if (this.seekPosition < this.startThreshold) {
                this.readPCMFromStart(data, datalen);
            } else {
                this.readPCM(data, datalen);
            }
            this.readCallbackLastCalled = this.seekPosition;
            this.advanceSeekPosition(datalen);
            return FMOD.OK;
        };
        FMOD.Result = FMOD.Core.createStream(
            '',
            FMOD.OPENUSER | FMOD.LOOP_NORMAL | FMOD.ACCURATETIME,
            info,
            sound,
        );
        this.handle = sound.deref();
        if (this.handle === undefined) {
            throw new Error('handle is undefined ' + this.url);
        }
    }

    getPositionMilliseconds() {
        const { sampleRate, bytesPerSample, numChannels } = this.soundInfo;
        const sampleSecond = sampleRate * bytesPerSample * numChannels;
        return (1000 * this.seekPosition) / sampleSecond;
    }

    private advanceSeekPosition(bytes: number) {
        const { sampleRate, bytesPerSample, numChannels } = this.soundInfo;
        const sampleSecond = sampleRate * bytesPerSample * numChannels;
        this.seekPosition =
            (this.seekPosition + bytes) % (sampleSecond * this.length);
    }

    async seek(position: number) {
        this.currentSeekAbort.abort();

        this.currentSeekAbort = new AbortController();

        // console.debug(this.url, 'seeking', position);
        if (position < this.startThreshold) {
            // The seek is inside the start buffer, so it can be done immediately
            this.startBuffer.unsafeSeek(position);

            this.seekPosition = position;

            const length = this.soundInfo.bytesPerSecond * this.length;

            if (this.decodeBuffer.fresh || length <= this.startThreshold)
                return;

            await this.forceSeekDecodeBuffer(this.startThreshold);
            // console.debug(this.url, 'finished seeking');
        } else if (
            position >= this.seekPosition &&
            position < this.seekPosition + this.decodeBuffer.status.size
        ) {
            this.decodeBuffer.read(position - this.seekPosition);
            this.seekPosition = position;
        } else {
            this.stop();

            await this.forceSeekDecodeBuffer(this.startThreshold);
            await this.decodeBuffer.canRead;
            this.seekPosition = position;
            this.restart();
        }
    }

    async unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        console.debug('unloading', this.url);
        this.handle.release();
        this.handle = null;
        this.startBuffer.free();
        this.fileBuffer.free();
        this.decodeBuffer.free();
        if (this.decoder !== null) {
            await this.decoder.free();
            this.decoder = null;
        }
    }

    release() {
        // this.handle.release();
    }
}

export class StaticSound implements RemoteSound {
    public source: FMODMountedFile;
    public handle: any;
    public start: number;
    public end: number;

    constructor(
        remotePath: string,
        filename: string,
        start: number,
        end: number,
        stream = false,
    ) {
        this.source = new FMODMountedFile(remotePath, filename);
        this.handle = null;
        this.start = start;
        this.end = end;
    }

    async fetch() {
        await this.source.fetch();
    }

    get isLoaded() {
        console.debug('LOADED CHECK', typeof this.handle);
        return this.handle !== null && this.handle !== undefined;
    }

    load() {
        if (!this.source.fetchStatus.isResolved) {
            return false;
        }

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();

        info.length = this.source.length;
        info.numchannels = 2;
        info.defaultfrequency = 48000;
        info.decodebuffersize = 48000;
        info.format = FMOD.SOUND_FORMAT_PCM16;
        // info.suggestedsoundtype = FMOD.SOUND_TYPE_WAV;
        const mode = FMOD.LOOP_NORMAL | FMOD.CREATESAMPLE;

        FMOD.Result = FMOD.Core.createSound(
            '/' + this.source.filename,
            mode,
            info,
            sound,
        );
        this.handle = sound.deref();
        return true;
    }

    async unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        this.handle.bytesFreerelease();
        this.handle = null;
    }
    release() {
        this.source.release();
    }
}
