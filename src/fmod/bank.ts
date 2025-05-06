import { FMOD } from './system';
import { Pointer } from './pointer';
import { RemoteFMODStatus } from './remoteFMODStatus';
import { FMODMountedFile } from './mountedFile';



export class Bank {
    file: FMODMountedFile
    private handle: any;
    private error: Error | null;

    constructor(name: string, url: string) {
        this.file = new FMODMountedFile(url, name + '.bank');
        this.handle = null;
        this.error = null;
    }

    getStatus(): RemoteFMODStatus {
        if (this.error !== null) return {
            status: 'error',
            error: this.error
        };

        if (this.handle === null) return {
            status: 'unloaded',
            error: null
        }

        return {
            status: this.file.fetchStatus.isSettled ? 'fetched' : 'loaded',
            error: null
        }
    }

    isLoaded() {
        const { status } = this.getStatus();
        return status === 'loaded';
    }

    async fetch() {
        try {
            await this.file.fetch();
        } catch (error) {
            this.error = error as Error;
        }
    }

    // TODO: Change the string formatting of this file so that the .bank is included
    async load() {
        const outval = new Pointer<any>();
        try {
            await this.file.fetchStatus;
            console.log(`/${this.file.filename}.bank`);
            FMOD.Result = FMOD.Studio.loadBankFile(`/${this.file.filename}`, FMOD.STUDIO_LOAD_BANK_NORMAL, outval);
            this.handle = outval.deref();
        } catch (error) {
            this.error = error as Error;
        }
    }

    unload() {
        const { status } = this.getStatus();
        if (status !== 'loaded') {
            this.error = new Error(`Tried to unload ${this.file.filename} - only loaded banks can be unloaded.`);
            return;
        }

        try {
            FMOD.Result = this.handle.unload();
            this.handle = null;
        } catch (error) {
            this.error = error as Error;
        }
    }

    unmount() {
        this.file.unmount();
    }
}
