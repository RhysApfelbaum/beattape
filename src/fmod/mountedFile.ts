import { FMOD } from './system';
import { PromiseStatus } from './promiseStatus';
import { dbg } from './helpers';

const DEFAULT_SOUND_INFO = {
    sampleRate: 44100,
    numChannels: 2,
    bytesPerSample: 2,
    bufferThreshold: 20,
};

export interface RemoteSoundData {
    url: string;
    fetchStatus: PromiseStatus;
    soundInfo: typeof DEFAULT_SOUND_INFO;
    fetch: () => Promise<void>;
    release: () => void;
}

export class FMODMountedFile implements RemoteSoundData {
    url: string;
    filename: string;
    fetchStatus: PromiseStatus;
    soundInfo: typeof DEFAULT_SOUND_INFO;
    length: number;

    constructor(remotePath: string, filename: string) {
        this.url = remotePath;
        this.filename = filename;
        this.fetchStatus = new PromiseStatus();
        this.soundInfo = DEFAULT_SOUND_INFO;
        this.length = 0;
    }

    async fetch() {
        const canRead = true;
        const canWrite = false;
        const canOwn = false;

        if (this.fetchStatus.isResolved) {
            throw new Error(`${this.filename} has already been fetched`);
        }

        try {
            const response = await fetch(this.url);
            const buffer = await response.arrayBuffer();
            const responseData = new Uint8Array(buffer);
            this.length = buffer.byteLength;

            FMOD.FS_createDataFile(
                '/',
                this.filename,
                responseData,
                canRead,
                canWrite,
                canOwn,
            );
            this.fetchStatus.resolve();
        } catch (error) {
            console.error(error);
            this.fetchStatus.reject(error);
        }
    }

    release() {
        try {
            FMOD.FS_unlink('/' + this.filename);
        } catch (error) {
            dbg('duplicate filename', this.filename);
        }
        this.fetchStatus = new PromiseStatus();
    }
}
