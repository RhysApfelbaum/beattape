import { RingBuffer, StereoSampleQueue } from "./buffering";
import { gesture } from "./gesture";
import { FMODMountedFile, RemoteSampleBuffer, RemoteSoundData } from "./mountedFile";
import { Pointer } from "./pointer";
import { PromiseStatus } from "./promiseStatus";
import { FMOD } from "./system";

const MAX_SIGNED_INT_16 = 32767;

export interface RemoteSound {
    source: RemoteSoundData;
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
    source: RemoteSampleBuffer;
    private buffer: RingBuffer;
    private url: string;
    handle: any;
    start: number;
    end: number;
    onUnderRead: () => Promise<void>;
    stop: () => void;
    restart: () => void;
    

    constructor(
        url: string,
        start: number,
        end: number,
        onStop: () => void,
        onRestart: () => void
    ) {
        this.start = start;
        this.end = end;
        this.stop = onStop;
        this.restart = onRestart;
        this.url = url;
        this.source = new RemoteSampleBuffer(url, 40);
        this.buffer = new RingBuffer(44100 * 20);
        this.onUnderRead = async () => {
            this.stop();
            this.source.canRestart = new PromiseStatus();
            await this.source.canRestart.promise;
            this.restart();
        };
    }

    async fetch() {
        await gesture.promise;
        const context = new AudioContext();
        const element = new Audio(this.url);
        element.crossOrigin = 'anonymous';
        const source = context.createMediaElementSource(element);
        await context.audioWorklet.addModule('/pcmProcessor.js');
        const node = new AudioWorkletNode(context, 'pcm-processor');
        node.port.onmessage = async (event: MessageEvent<ArrayBuffer>) => {
            const { full } = this.buffer.write(event.data);
            if (full) {
                element.pause();
                await this.buffer.ready;
                element.play();
            }
        };
        source.connect(node);
        element.play();
    }

    get isLoaded() {
        return this.handle !== null;
    }

    load() {
        // if (!this.source.fetchStatus.isResolved) {
        //     return false;
        // }

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        const { sampleRate, numChannels, bytesPerSample } = this.source.soundInfo;

        info.length = (this.end - this.start) * sampleRate * bytesPerSample;
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
            console.log('pcmcallback', sound, subsound, position, postype);
            return FMOD.OK;
        };

        info.pcmreadcallback = (sound: any, data: any, datalen: number) => {
            console.log('requesting', datalen);
            // const { left, right, retrievedSize, underRead } = this.source.retrieve(datalen / 2);
            const { view, wrappedView, wrap, underflow } = this.buffer.read(datalen);


            if (underflow) {
                // this.onUnderRead();
                console.log('underflow');
                FMOD.HEAPU8.set(new Uint8Array(datalen).fill(0), data);
                return FMOD.OK;
            }

            FMOD.HEAPU8.set(view, data);
            if (wrap) {
                FMOD.HEAPU8.set(wrappedView, data + view.length);
            }



            // if (underflow) this.onUnderRead();
            return FMOD.OK;
        };
        FMOD.Result = FMOD.Core.createStream('', FMOD.OPENUSER | FMOD.LOOP_NORMAL, info, sound);
        this.handle = sound.deref();
        return true;
    };

    async unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        this.handle.release();
        this.handle = null;
    };

    release() {
        this.source.release();
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

