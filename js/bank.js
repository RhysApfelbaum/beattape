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
        this.buffer;
        this.loadingState = LOADING_STATE.UNLOADED;
    }


    fetch() {
        this.buffer = new Promise(async (resolve, reject) => {
            try {
                let response = await fetch(this.url)
                let buffer = await response.arrayBuffer();
                this.loadingState = LOADING_STATE.FETCHED;
                resolve(new Uint8Array(buffer));
            } catch(error) {
                this.loadingState = LOADING_STATE.ERROR;
                reject(error);
            }
        });
    }

    async load() {
        let outval = {};

        const canRead = true;
        const canWrite = false;
        const canOwn = false;

        try {
            // Write buffer to local file using this completely undocumented emscripten function :)
            FMOD.FS_createDataFile('/', `${this.name}.bank`, await this.buffer, canRead, canWrite, canOwn);
            CHECK_RESULT(gSystem.loadBankFile(`/${this.name}.bank`, FMOD.STUDIO_LOAD_BANK_NORMAL, outval));
            this.loadingState = LOADING_STATE.LOADED;
     
            return outval.val;
            
        }
        catch(error) {
            this.loadingState = LOADING_STATE.ERROR;
            throw error;
        }
    }
}