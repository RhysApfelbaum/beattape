import { StereoSampleQueue } from "./buffering";
import { FMODMountedFile, RemoteSampleBuffer, RemoteSoundData } from "./mountedFile";
import { Pointer } from "./pointer";
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
}

export class StreamedSound implements RemoteSound {
    source: RemoteSampleBuffer;
    handle: any;
    start: number;
    end: number;
    sampleRate: number;

    constructor(url: string, start: number, end: number) {
        this.source = new RemoteSampleBuffer(url, 44100 * 10);
        this.start = start;
        this.end = end;
        this.sampleRate = 44100;
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

        info.length = (this.end - this.start) * sampleRate * bytesPerSample * numChannels;
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
            console.log('datalen', datalen);
            console.log('sound', sound);
            const openstate = new Pointer<any>();
            const percentbuffered = new Pointer<any>();
            const starving = new Pointer<any>();
            const diskbusy = new Pointer<any>();

            const { left, right, retrievedSize } = this.source.retrieve(datalen);

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
            sound.getOpenState(openstate, percentbuffered, starving, diskbusy);
            console.log(openstate, percentbuffered, starving, diskbusy);

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
}

export class StaticSound {
    public file: FMODMountedFile;
    public handle: any;
    public start: number;
    public end: number;

    constructor(remotePath: string, filename: string, start: number, end: number, stream = false) {
        this.file = new FMODMountedFile(remotePath, filename);
        this.handle = null;
        this.start = start;
        this.end = end;
    }

    async fetch() {
        await this.file.fetch();
    }

    get isLoaded() {
        return this.handle !== null;
    }


    load() {
        if (!this.file.fetchStatus.isResolved) {
            return false;
        }

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();

        info.length = this.file.length;
        info.numchannels = 2;
        info.defaultfrequency = 48000;
        info.decodebuffersize = 48000;
        info.format = FMOD.SOUND_FORMAT_PCM16;
        // info.suggestedsoundtype = FMOD.SOUND_TYPE_WAV;
        const mode = FMOD.LOOP_NORMAL | FMOD.CREATESAMPLE;

        FMOD.Result = FMOD.Core.createSound('/' + this.file.filename, mode, info, sound);
        this.handle = sound.deref();
        return true;
    }

    unload() {
        if (!this.isLoaded) {
            throw new Error('Tried to unload a sound that is not loaded.');
        }
        this.handle.release();
        this.handle = null;
    }

}

