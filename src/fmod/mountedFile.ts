import { FMOD } from './system';
import { PromiseStatus } from './promiseStatus';


export class FMODMountedFile {
    url: string;
    filename: string;
    fetchStatus: PromiseStatus;
    length: number;

    constructor(remotePath: string, filename: string) {
        this.url = remotePath;
        this.filename = filename;
        this.fetchStatus = new PromiseStatus();
        this.length = 0;
    }

    async fetch() {
        const canRead = true;
        const canWrite = false;
        const canOwn = false;

        if (this.fetchStatus.isResolved) {
            console.error(`${this.filename} has already been fetched`);
        }

        try {
            const response = await fetch(this.url)
            const buffer = await response.arrayBuffer();
            this.length = buffer.byteLength;
            // Write buffer to local file using this completely undocumented emscripten function :)
            FMOD.FS_createDataFile('/', this.filename, new Uint8Array(buffer), canRead, canWrite, canOwn);
            this.fetchStatus.resolve();
        } catch (error) {
            this.fetchStatus.reject(error);
        }


        // this.loadingState = LoadingState.FETCHED;
    }

    unmount() {
        FMOD.unlink(`/${this.filename}`);
        this.fetchStatus = new PromiseStatus();
    }
}
