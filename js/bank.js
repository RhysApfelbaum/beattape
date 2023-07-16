//import {FMOD} from './fmodObjects.js';


const LOADING_STATE = Object.freeze({
    UNLOADED: 0,
    FETCHED: 1,
    LOADED: 2,
    ERROR: 3
});

class Bank {

    constructor(name, url) {
        this.name = name;
        this.url = url;
        this.fetchPromise = null;
        this.loadingState = LOADING_STATE.UNLOADED;
    }


    fetch() {
        const canRead = true;
        const canWrite = false;
        const canOwn = false;
        if (this.loadingState != LOADING_STATE.UNLOADED) {
            console.error(`${this.name}.bank has already been fetched`);
        }
        this.fetchPromise = new Promise(async (resolve, reject) => {
            try {
                const response = await fetch(this.url)
                const responseBuffer = await response.arrayBuffer();
                const responseData = new Uint8Array(responseBuffer);

                // Write buffer to local file using this completely undocumented emscripten function :)
                FMOD.FS_createDataFile('/', `${this.name}.bank`, responseData, canRead, canWrite, canOwn);

                this.loadingState = LOADING_STATE.FETCHED;
                resolve();
            } catch(error) {
                this.loadingState = LOADING_STATE.ERROR;
                console.error(error);
                reject(error);
            }
        });
    }

    async load() {
        const outval = {};
        try {
            await this.fetchPromise;
            CHECK_RESULT(gSystem.loadBankFile(`/${this.name}.bank`, FMOD.STUDIO_LOAD_BANK_NORMAL, outval));
            this.loadingState = LOADING_STATE.LOADED;

            // Return the newly created bank handle
            return outval.val;
        }
        catch(error) {
            this.loadingState = LOADING_STATE.ERROR;
            throw error;
        }
    }

    unlink() {
        FMOD.unlink(`/${this.name}.bank`);
        this.fetchPromise = null;
        this.loadingState = LOADING_STATE.UNLOADED;
    }
}