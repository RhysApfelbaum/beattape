import { FMODMountedFile } from "./mountedFile";
import { Pointer } from "./pointer";
import { FMOD } from "./system";


export class Sound {
    public file: FMODMountedFile;
    private error: Error | null;
    public handle: any;

    constructor(remotePath: string, filename: string) {
        this.file  = new FMODMountedFile(remotePath, filename);
        this.error = null;
        this.handle = null;
    }

    async fetch() {
        try {
            await this.file.fetch();
        } catch (error) {
            this.error = error as Error;
        }
    }


    load() {
        if (!this.file.fetchStatus.isResolved) {
            return false;
        }

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        console.log(info);

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

}

