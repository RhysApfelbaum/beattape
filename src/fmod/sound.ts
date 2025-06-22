import { MPEGDecoderWebWorker } from "mpg123-decoder";
import { RingBuffer } from "./buffering";
import { gesture, onUserGesture } from "./gesture";
import { FMODMountedFile  } from "./mountedFile";
import { Pointer } from "./pointer";
import { RemoteFMODStatus } from "./remoteFMODStatus";
import { FMOD } from "./system";

const DEFAULT_SOUND_INFO = {
    sampleRate: 48000,
    numChannels: 2,
    bytesPerSample: 2,
    bufferThreshold: 20
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
    private buffer: RingBuffer;
    private soundInfo: typeof DEFAULT_SOUND_INFO;
    private element: HTMLAudioElement;
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
        onStop = () => {},
        onRestart = () => {}
    ) {
        this.start = start;
        this.end = end;
        this.stop = onStop;
        this.restart = onRestart;
        this.url = url;
        this.soundInfo = DEFAULT_SOUND_INFO;
        this.element = new Audio(url);
        this.length = length;
        this.element.crossOrigin = 'anonymous';
        this.element.playbackRate = 1;
        const { sampleRate, numChannels, bytesPerSample } = this.soundInfo;
        this.buffer = new RingBuffer(sampleRate * numChannels * bytesPerSample * length);
    }

    async fetch() {
        const decoder = new MPEGDecoderWebWorker();
        await decoder.ready;
        const response = await fetch(this.url);
        if (!response.body) {
            throw new Error('Something went wrong with fetching audio here ahhh');
        }
        const reader = response.body.getReader({ mode: 'byob' });
        let chunkBuffer = new ArrayBuffer(10000);
        while (true) {
            const view = new Uint8Array(chunkBuffer);
            const { done, value } = await reader.read(view);
            if (done) {
                break;
            }
            const { channelData } = await decoder.decode(value);

            chunkBuffer = value.buffer as ArrayBuffer;

            const [ left, right ] = channelData;

            const length = Math.min(left.length, right.length);

            // Create Int16Array for interleaved stereo output
            const int16Buffer = new Int16Array(length * 2);

            // TODO Maybe there's a clever way to sort out the floats
            for (let i = 0; i < length; i++) {
                // Clamp float sample to [-1, 1] and convert to 16-bit PCM
                int16Buffer[i * 2] = Math.max(-1, Math.min(1, left[i])) * 0x7FFF;
                int16Buffer[i * 2 + 1] = Math.max(-1, Math.min(1, right[i])) * 0x7FFF;
            }
            const { full, loss } = this.buffer.write(int16Buffer.buffer as ArrayBuffer);
        }
    }

    get status(): RemoteFMODStatus {
        if (this.buffer.ready.isResolved) {
            return { status: 'fetched', error: null };
        }

        if (this.isLoaded) {
            return { status: 'loaded', error: null };
        }

        return { status: 'unloaded', error: null };
    }

    get isLoaded() {
        return this.handle !== null;
    }

    async load() {
        await this.buffer.ready;

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        const { sampleRate, numChannels, bytesPerSample } = this.soundInfo;

        info.length = this.length * numChannels * sampleRate * bytesPerSample;
        info.numchannels = numChannels;
        info.defaultfrequency = sampleRate;
        info.decodebuffersize = sampleRate;
        info.format = FMOD.SOUND_FORMAT_PCM16;

        info.pcmsetposcallback = (
            sound: any,
            subsound: any,
            position: any,
            postype: any
        ) => {
            console.log(this.url, 'seeking', position);
            const { sampleRate } = this.soundInfo;
            this.seek(position / sampleRate);
            return FMOD.OK;
        };

        info.pcmreadcallback = (sound: any, data: any, datalen: number) => {
            const { view, wrappedView, wrap, underflow } = this.buffer.read(
                Math.min(datalen, this.buffer.capacity)
            );

            if (underflow) {
                this.stop();
                this.buffer.ready.then(() => this.restart());
                return FMOD.OK;
            }
            FMOD.HEAPU8.set(view, data);
            if (wrap) {
                FMOD.HEAPU8.set(wrappedView, data + view.length);
            }
            return FMOD.OK;
        };
        FMOD.Result = FMOD.Core.createStream('', FMOD.OPENUSER | FMOD.ACCURATETIME | FMOD.LOOP_NORMAL, info, sound);
        this.handle = sound.deref();
        return true;
    };

    seek(time: number) {
        const { sampleRate, bytesPerSample, numChannels } = this.soundInfo;
        this.buffer.seek(sampleRate * bytesPerSample * numChannels * time);
    }

    async unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        this.handle.release();
        this.handle = null;
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

