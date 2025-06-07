import { StereoSampleQueue } from "./buffering";
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
        this.source = new RemoteSampleBuffer(url, 44100 * 40);
        this.onUnderRead = async () => {
            this.stop();
            this.source.canRestart = new PromiseStatus();
            await this.source.canRestart.promise;
            this.restart();
        };
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
            const { left, right, retrievedSize, underRead } = this.source.retrieve(datalen / 2);

            for (let i = 0; i < (datalen >> 2); i++) {
                const offset = data + (i << 2);
                if (i <= retrievedSize) {
                    FMOD.setValue(offset + 0, left[i] * MAX_SIGNED_INT_16, 'i16');    // left channel
                    FMOD.setValue(offset + 2, right[i] * MAX_SIGNED_INT_16, 'i16');    // right channel
                } else {
                    // Panic! Run out of samples!
                    FMOD.setValue(offset + 0, 0, 'i16');    // left channel
                    FMOD.setValue(offset + 2, 0, 'i16');    // right channel
                }
            }

            if (underRead) this.onUnderRead();
            return FMOD.OK;
        };
        FMOD.Result = FMOD.Core.createStream('', FMOD.OPENUSER, info, sound);
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

