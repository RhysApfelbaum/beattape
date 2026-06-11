import { FMOD } from "./system";


const DIR_MODE = 16895 // 040777
const FILE_MODE = 33206 // 100666
const SEEK_SET = 0
const SEEK_CUR = 1
const SEEK_END = 2

// WASI error codes
// See https://github.com/WebAssembly/wasi-libc/blob/master/libc-bottom-half/headers/public/wasi/api.h
const EINVAL = 28
const ENOENT = 44

const MAX_STREAMS = 256;

export class AudioConnection {
    reader: Promise<ReadableStreamBYOBReader>;
    private url: string;

    constructor(url: string) {
        this.url = url;
        this.reader = this.newReader();
    }

    private async newReader() {
        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${this.url}: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.body) {
            throw new Error(`Failed to fetch ${this.url}: No response body`);
        }
        return response.body.getReader({ mode: 'byob' });
    }

    restart() {
        this.reader = this.newReader();
    }
}

export class AudioStreams {
    private connections: Map<number, AudioConnection>;
    private fs: any;

    // A bit jank
    private nextID: number;

    constructor() {
        if (!FMOD.FS) {
            throw new Error('FMOD.FS not initialized!');
        }

        this.nextID = 0;

        this.connections = new Map();

        this.fs = FMOD.FS;
        
        const streamFS = {
        };

        this.fs.mkdir('/audio');
        this.fs.mount(streamFS, {}, '/audio');
    }

    add(url: string) {
        const id = this.nextID;

        if (id === Number.MAX_SAFE_INTEGER) {
            this.nextID = 0;
        } else {
            this.nextID += 1;
        }
        const u = new URL(url);

        this.connections.set(id, new AudioConnection(url));
        this.fs.createFile('/audio/')
    }

    remove(id: number) {
        this.connections.delete(id);
    }

}
