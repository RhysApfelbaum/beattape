import { FMOD } from './system';
import { Pointer } from './pointer';

export enum LoadingState {
    UNLOADED = 'UNLOADED',
    FETCHED = 'FETCHED',
    LOADED = 'LOADED',
    ERROR = 'ERROR'
}

export class Bank {
    name: string;
    url: string;
    fetchPromise: Promise<void>;
    loadingState: LoadingState;
    handle: any;

    constructor(name: string, url: string) {
        this.name = name;
        this.url = url;
        this.fetchPromise = null;
        this.loadingState = LoadingState.UNLOADED;
        this.handle = null;
    }

    fetch() {
        const canRead = true;
        const canWrite = false;
        const canOwn = false;

        if (this.loadingState != LoadingState.UNLOADED) {
            console.error(`${this.name}.bank has already been fetched`);
        }
        this.fetchPromise = (async (): Promise<void> => {
            const response = await fetch(this.url)
            const responseBuffer = await response.arrayBuffer();
            const responseData = new Uint8Array(responseBuffer);

            // Write buffer to local file using this completely undocumented emscripten function :)
            FMOD.FS_createDataFile('/', `${this.name}.bank`, responseData, canRead, canWrite, canOwn);

            this.loadingState = LoadingState.FETCHED;
        })();
    }

    async load() {
        const outval = new Pointer<any>();
        try {
            await this.fetchPromise;
            FMOD.Result = FMOD.Studio.loadBankFile(`/${this.name}.bank`, FMOD.STUDIO_LOAD_BANK_NORMAL, outval);
            this.loadingState = LoadingState.LOADED;
            this.handle = outval.deref();
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
        this.fetchPromise = null;
        this.loadingState = LoadingState.UNLOADED;
    }
}
