import { FMOD } from './system';
import { Pointer } from './pointer';
import { Deferred } from './deferred';

export enum LoadingState {
    UNLOADED = 'UNLOADED',
    FETCHED = 'FETCHED',
    LOADED = 'LOADED',
    ERROR = 'ERROR'
}

export class Bank {
    name: string;
    url: string;
    fetched: Deferred<void>;
    loadingState: LoadingState;
    handle: any;

    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
        this.fetched = new Deferred<void>();
        this.loadingState = LoadingState.UNLOADED;
        this.handle = null;
    }

    async fetch() {
        const canRead = true;
        const canWrite = false;
        const canOwn = false;

        if (this.loadingState !== LoadingState.UNLOADED) {
            console.error(`${this.name}.bank has already been fetched`);
        }

        const response = await fetch(this.url)
        const responseBuffer = await response.arrayBuffer();
        const responseData = new Uint8Array(responseBuffer);

        // Write buffer to local file using this completely undocumented emscripten function :)
        FMOD.FS_createDataFile('/', `${this.name}.bank`, responseData, canRead, canWrite, canOwn);

        this.loadingState = LoadingState.FETCHED;
        this.fetched.resolve();
    }

    async load() {
        const outval = new Pointer<any>();
        try {
            await this.fetched;
            FMOD.Result = FMOD.Studio.loadBankFile(`/${this.name}.bank`, FMOD.STUDIO_LOAD_BANK_NORMAL, outval);
            this.loadingState = LoadingState.LOADED;
            this.handle = outval.deref(); // Even if you're not doing anything with this, it has to be in memory.
        } catch(error) {
            this.loadingState = LoadingState.ERROR;
            console.error(error);
        }
    }

    unload() {
        if (this.loadingState != LoadingState.LOADED) {
            console.error(`Tried to unload ${this.name}.bank - only loaded banks can be unloaded.`);
            return;
        }
        FMOD.Result = this.handle.unload();
    }

    unlink() {
        FMOD.unlink(`/${this.name}.bank`);
        this.fetched = new Deferred<void>();
        this.loadingState = LoadingState.UNLOADED;
    }
}
