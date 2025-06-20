import { RingBuffer, SizedBuffer, StereoSampleQueue } from "./buffering";
import { gesture } from "./gesture";
import { FMODMountedFile, RemoteSampleBuffer, RemoteSoundData } from "./mountedFile";
import { Pointer } from "./pointer";
import { PromiseStatus } from "./promiseStatus";
import { SoundInfo } from "./soundLoader";
import { FMOD } from "./system";

const MAX_SIGNED_INT_16 = 32767;

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
    load: () => boolean;
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
        const { sampleRate, numChannels, bytesPerSample } = this.soundInfo;
        this.buffer = new RingBuffer(sampleRate * numChannels * bytesPerSample * length);
    }

    async fetch() {
        await gesture.promise;
        const context = new AudioContext();
        const source = context.createMediaElementSource(this.element);
        await context.audioWorklet.addModule('/pcmProcessor.js');
        const node = new AudioWorkletNode(context, 'pcm-processor');
        if (this.url.includes('bass.wav')) {
            console.log('called fetch on ' + this.url);
        }
        node.port.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
            const { full } = this.buffer.write(event.data);
            if (this.url.includes('bass.wav')) {
                console.log('wrote ' + event.data.byteLength + 'to buffer');
                console.log(this.buffer.getStatus());
            }
            // if (full) {
            //     console.log('full');
            // }
            // if (full) {
            //     this.element.pause();
            //     await this.buffer.ready;
            //     this.element.play();
            // }
        };
        source.connect(node);
        this.element.play();
    }

    get isLoaded() {
        return this.handle !== null;
    }

    // get timeBuffered() {
    //     const { size } = this.buffer.getStatus();
    //     const bytesPerSecond = 48000 * 2 * 2;
    //     return size / bytesPerSecond;
    // }

    load() {
        // if (!this.source.fetchStatus.isResolved) {
        //     return false;
        // }

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
            const { view, wrappedView, wrap, underflow } = this.buffer.read(Math.min(datalen, this.buffer.capacity));
            // const { view, underflow } = this.buffer.read(datalen);
            if (this.url.includes('bass.wav')) {
                console.log('trying to read ' + this.url);
                // console.log('read ' + (view?.byteLength ?? 0) + (wrappedView?.byteLength ?? 0) + ' bytes');
            }

            if (underflow) {
                this.stop();
                this.buffer.ready.then(() => this.restart());
                console.log(this.url + ' underflow');
                console.log(this.buffer.getStatus());
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

