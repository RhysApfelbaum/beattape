import { FMODMountedFile } from "./mountedFile";
import { Pointer } from "./pointer";
import { FMOD } from "./system";


export class Sound {
    public file: FMODMountedFile;
    public error: Error | null;
    public handle: any;
    public start: number;
    public end: number;

    constructor(remotePath: string, filename: string, start: number, end: number) {
        this.file  = new FMODMountedFile(remotePath, filename);
        this.error = null;
        this.handle = null;
        this.start = start;
        this.end = end;
        console.log('sound', remotePath, filename);
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
        info.suggestedsoundtype = FMOD.SOUND_TYPE_WAV;
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

