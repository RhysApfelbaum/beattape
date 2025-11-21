import { FMOD } from './system';
import { Pointer } from './pointer';
import { RemoteFMODStatus } from './remoteFMODStatus';
import { FMODMountedFile } from './mountedFile';

export class Bank {
    file: FMODMountedFile;
    private handle: any;
    private error: Error | null;

    constructor(name: string, url: string) {
        this.file = new FMODMountedFile(url, name);
        this.handle = null;
        this.error = null;
    }

    getStatus(): RemoteFMODStatus {
        if (this.error !== null)
            return {
                status: 'error',
                error: this.error,
            };

        if (!this.file.fetchStatus.isResolved) {
            return {
                status: 'unloaded',
                error: null,
            };
        }

        if (this.handle === null)
            return {
                status: 'fetched',
                error: null,
            };

        return {
            status: 'loaded',
            error: null,
        };
    }

    get isLoaded() {
        const { status } = this.getStatus();
        return status === 'loaded';
    }

    async fetch() {
        const { status } = this.getStatus();
        if (status === 'loaded' || status === 'fetched') {
            return;
        }
        await this.file.fetch();
    }

    // TODO: Change the string formatting of this file so that the .bank is included
    async load() {
        const outval = new Pointer<any>();
        await this.file.fetchStatus;
        FMOD.Result = FMOD.Studio.loadBankFile(
            `/${this.file.filename}`,
            FMOD.STUDIO_LOAD_BANK_NORMAL,
            outval,
        );
        this.handle = outval.deref();
    }

    unload() {
        const { status } = this.getStatus();
        if (status !== 'loaded') {
            throw new Error(
                `Tried to unload ${this.file.filename} - only loaded banks can be unloaded.`,
            );
        }
        FMOD.Result = this.handle.unload();
        this.handle = null;
    }

    unmount() {
        // this.file.unmount();
    }
}
