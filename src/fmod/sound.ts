import { MPEGDecoderWebWorker } from "mpg123-decoder";
import { RingBuffer, RingBufferReadResult, Sink } from "./buffering";
import { gesture, onUserGesture } from "./gesture";
import { FMODMountedFile  } from "./mountedFile";
import { Pointer } from "./pointer";
import { RemoteFMODStatus } from "./remoteFMODStatus";
import { FMOD } from "./system";
import { assertEqual, assertNotNull, unreachable } from "./helpers";
import { PromiseStatus } from "./promiseStatus";

const DEFAULT_SOUND_INFO = {
    sampleRate: 48000,
    numChannels: 2,
    bytesPerSample: 2,
    get bytesPerSecond() {
        return this.bytesPerSample * this.sampleRate * this.numChannels;
    }
    
}

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
    private fileBuffer: RingBuffer;
    private decodeBuffer: RingBuffer;
    private startBuffer: RingBuffer;
    private decoder: MPEGDecoderWebWorker;
    private soundInfo: typeof DEFAULT_SOUND_INFO;
    private seekPosition: number;
    private decodePosition: number;
    private decodeBufferStartPosition: number;
    private decodeChunk: (chunk: Uint8Array) => Promise<Uint8Array>;
    private startThreshold: number;
    private readCallbackLastCalled: number;
    private timelinePosition: number;

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
        onRestart = () => {}
    ) {
        this.start = start;
        this.end = end;
        this.stop = onStop;
        this.restart = onRestart;
        this.url = url;
        this.soundInfo = DEFAULT_SOUND_INFO;
        this.soundInfo.sampleRate = sampleRate;
        this.length = length;
        this.fileBuffer = new RingBuffer(true);
        this.startBuffer = new RingBuffer(true);
        this.decodeBuffer = new RingBuffer(false);
        this.startThreshold = this.soundInfo.bytesPerSecond * 4;

        this.decodePosition = 0; // Measured in SAMPLES
        this.seekPosition = 0;
        this.decodeBufferStartPosition = this.startThreshold;
        this.decoder = new MPEGDecoderWebWorker();
        this.decoding = true;
        this.decodingStatus = new PromiseStatus();
        this.decodingStatus.resolve();
        this.readCallbackLastCalled = 0;
        this.timelinePosition = 0;

        this.decodeChunk = async chunk => {
            const { channelData, samplesDecoded, errors } = await this.decoder.decode(chunk);
            const [ left, right ] = channelData;

            // Discard samples that overshoot the theoretical limit
            const sampleCount = this.soundInfo.sampleRate * this.length;
            const remainingSamples = sampleCount - this.decodePosition;
            const length = Math.min(samplesDecoded, remainingSamples);

            this.decodePosition = (this.decodePosition + length) % sampleCount;

            // Create Int16Array for interleaved stereo output
            const int16Buffer = new Int16Array(length * 2);

            // TODO Maybe there's a clever way to sort out the floats
            for (let i = 0; i < length; i++) {
                // Clamp float sample to [-1, 1] and convert to 16-bit PCM
                int16Buffer[i * 2] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF;
                int16Buffer[i * 2 + 1] = Math.max(-1, Math.min(1, right[i])) * 0x7FFF;
            }
            return new Uint8Array(int16Buffer.buffer);
        }
    }

    private async download() {
        const response = await fetch(this.url);

        assertNotNull(this.decoder); // Sanity check
        if (!response.ok) {
            throw new Error(`Failed to fetch ${this.url}: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error(`Failed to fetch ${this.url}: No response body`);
        }

        const lengthHeader = response.headers.get('Content-Length');
        if (!lengthHeader) {
            throw new Error(`No Content-Length header in response from ${this.url}`);
        }

        const fileLength = Number(lengthHeader);

        if (!Number.isFinite(fileLength) || fileLength < 0) {
            throw new Error(`Invalid Content-Length value: "${lengthHeader}"`);
        }

        this.fileBuffer.allocate(fileLength, StreamedSound.DECODE_CHUNK_SIZE);

        const reader = response.body.getReader({ mode: 'byob' });

        let chunkBuffer = new ArrayBuffer(StreamedSound.DECODE_CHUNK_SIZE);
        while (true) {
            const view = new Uint8Array(chunkBuffer);
            const { done, value } = await reader.read(view);
            if (done) {
                break;
            }
            // console.log('filebuffer write');
            await this.fileBuffer.write(value);
            // console.log('wrote', value.byteLength);
            chunkBuffer = value.buffer as ArrayBuffer;
        }
    }

    private async startDecoding(start: boolean) {
        let atStart = start;
        this.decoding = true;
        this.decodingStatus.reset();
        while (this.decoding) {
            const buffer = atStart ? this.startBuffer : this.decodeBuffer;
            const { leftover } = await this.fileBuffer.pipe(buffer, StreamedSound.DECODE_CHUNK_SIZE, this.decodeChunk);

            if (buffer.isFull()) {

                // Sanity check. The decode buffer should never be completely full
                if (atStart) {
                    atStart = false;
                    this.startBuffer.lock();
                }

                if (leftover.length > 0) {
                    await this.decodeBuffer.write(leftover);
                }
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
        this.timelinePosition = (seconds - this.start) * this.soundInfo.bytesPerSecond;
    }

    async fetch() {
        await this.decoder.ready;

        this.decodeBuffer.allocate(this.soundInfo.bytesPerSecond * StreamedSound.DECODE_BUFFER_SECONDS, this.soundInfo.bytesPerSecond * 2);
        this.startBuffer.allocate(this.startThreshold, this.startThreshold);

        // Start downloading the file
        this.download();

        // Start the decoding producer
        this.startDecoding(true);
    }

    get isLoaded() {
        return this.handle !== null;
    }

    private readPCMFromStart(heapPointer: number, requestedBytes: number) {
        const { wrap, view, wrappedView, underflow } = this.startBuffer.read(
            Math.min(requestedBytes, this.startBuffer.capacity)
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

        if (this.url === './track_audio/heavyFog/heavy_drums.mp3') {
            console.log(this.url, 'decode buffer request', requestedBytes);
        }
        const { wrap, view, wrappedView, underflow } = this.decodeBuffer.read(
            Math.min(requestedBytes, this.decodeBuffer.capacity)
        );

        if (underflow) {
            console.error(this.url, 'underflow');
            this.stop();
            this.decodeBuffer.canRead.then(() => this.restart());
            return;
        }

        FMOD.HEAPU8.set(view, heapPointer);

        this.decodeBufferStartPosition = this.decodeBufferStartPosition + view.length;

        if (wrap) {
            FMOD.HEAPU8.set(wrappedView, heapPointer + view.length);
            this.decodeBufferStartPosition += wrappedView.length
        }

        this.decodeBufferStartPosition %= this.soundInfo.bytesPerSecond * this.length;

    }

    updateDecoderPosition(seconds: number) {
        const targetSeekPosition = (seconds - this.start) * this.soundInfo.bytesPerSecond - this.startThreshold;
        const targetPosition = targetSeekPosition - this.decodeBufferStartPosition;
        console.log(this.url);
        if (targetPosition <= 0) {
            console.log('decode buffer ahead of playback');
            return;
        }

        // if (targetSeekPosition - this.readCallbackLastCalled < 4 * this.soundInfo.bytesPerSecond) {
        //     console.log('readCallbackCalled recently');
        //     return;
        // }

        console.log(this.decodeBuffer.getStatus());
        console.log(targetPosition);

        if (targetPosition >= this.decodeBuffer.bytesAvailable) {
            console.error('aggressively seeking', targetPosition);
            this.forceSeekDecodeBuffer(targetSeekPosition);
        } else {
            console.error('passively reading', targetPosition);
            this.decodeBuffer.read(targetPosition);
            this.decodeBufferStartPosition += targetPosition;
            this.decodeBufferStartPosition %= this.soundInfo.bytesPerSecond * this.length;
        }
    }

    async forceSeekDecodeBuffer(position: number) {
        await this.stopDecoding();

        // // All reads are sync
        const { numChannels, bytesPerSample } = this.soundInfo;

        
        // Completely rebuild the decoder, as this may cause errors
        await this.decoder.free();
        this.fileBuffer.unsafeSeek(0);
        this.decoder = new MPEGDecoderWebWorker();
        await this.decoder.ready;

        this.decodePosition = 0;

        this.decodeBuffer.flush();
        const sink = new Sink(position);
        let leftover = new Uint8Array();
        while (!sink.isFull()) {
            const result = await this.fileBuffer.pipe(
                sink,
                StreamedSound.DECODE_CHUNK_SIZE,
                this.decodeChunk
            );
            leftover = result.leftover;
        }

        if (leftover.length > 0) {
            await this.decodeBuffer.write(leftover);
        }

        this.decodeBufferStartPosition = position;
        console.log(this.decodeBuffer.getStatus());
        this.startDecoding(false);

    }


    async load() {
        assertNotNull(this.fileBuffer, 'file buffer is not initialised');
        await this.decodeBuffer.canRead;

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
            _postype: any
        ) => {
            const { sampleRate } = this.soundInfo;
            // console.log('seeking', this.url, position * this.soundInfo.bytesPerSample * this.soundInfo.numChannels);
            console.log(this.url, 'seek', position)
            const bytePosition = position * this.soundInfo.bytesPerSample * this.soundInfo.numChannels;
            this.seek(bytePosition);
            return FMOD.OK;
        };

        info.pcmreadcallback = (sound: any, data: number, datalen: number) => {
            // if (this.url.includes('heavy_drums')) {
            console.log(this.url, 'requested', datalen);
            // }
            //
            if (this.seekPosition < this.startThreshold) {
                this.readPCMFromStart(data, datalen);
            } else {
                this.readPCM(data, datalen);
            }
            this.readCallbackLastCalled = this.seekPosition;
            this.advanceSeekPosition(datalen);
            return FMOD.OK;
        };
        FMOD.Result = FMOD.Core.createStream('', FMOD.OPENUSER | FMOD.LOOP_NORMAL | FMOD.ACCURATETIME, info, sound);
        this.handle = sound.deref();
        console.log(this.url, this.handle);
        if (this.handle === undefined) {
            throw new Error('handle is undefined ' + this.url);
        }
    };

    getPositionMilliseconds() {
        const { sampleRate, bytesPerSample, numChannels } = this.soundInfo;
        const sampleSecond = sampleRate * bytesPerSample * numChannels;
        return 1000 * this.seekPosition / sampleSecond;
    }

    private advanceSeekPosition(bytes: number) {
        const { sampleRate, bytesPerSample, numChannels } = this.soundInfo;
        const sampleSecond = sampleRate * bytesPerSample * numChannels;
        this.seekPosition = (this.seekPosition + bytes) % (sampleSecond * this.length);
    }

    async seek(position: number) {
        if (position < this.startThreshold) {
            // The seek is inside the start buffer, so it can be done immediately
            this.startBuffer.unsafeSeek(position);

            this.seekPosition = position;

            if (this.decodeBuffer.fresh)
                return;

            await this.forceSeekDecodeBuffer(this.startThreshold);
        } else if (
            position >= this.decodeBufferStartPosition &&
            position < (this.decodeBufferStartPosition + this.decodeBuffer.bytesAvailable)
        ) {
            this.decodeBuffer.read(position - this.decodeBufferStartPosition);
            this.decodeBufferStartPosition += position;
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
        this.handle.release();
        this.handle = null;
        this.decodeBuffer.free();
        this.startBuffer.free();
        this.fileBuffer.free();
        await this.decoder.free();
    };

    release() {
        // this.handle.release();
    };
}

export class StaticSound implements RemoteSound {
    public source: FMODMountedFile;
    public handle: any;
    public start: number;
    public end: number;

    constructor(remotePath: string, filename: string, start: number, end: number, stream = false) {
        this.source = new FMODMountedFile(remotePath, filename);
        this.handle = null;
        this.start = start;
        this.end = end;
    }

    async fetch() {
        await this.source.fetch();
    }

    get isLoaded() {
        return this.handle !== null;
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

        FMOD.Result = FMOD.Core.createSound('/' + this.source.filename, mode, info, sound);
        this.handle = sound.deref();
        return true;
    }

    async unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        this.handle.release();
        this.handle = null;
    }

    release() {
        this.source.release();
    }
}

