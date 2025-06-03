import { FMOD } from './system';
import { PromiseStatus } from './promiseStatus';
import { StereoSampleQueue } from './buffering';
import { MPEGDecoderWebWorker } from 'mpg123-decoder';


const DEFAULT_SOUND_INFO = {
    sampleRate: 44100,
    numChannels: 2,
    bytesPerSample: 2
}

export interface RemoteSoundData {
    url: string;
    fetchStatus: PromiseStatus;
    soundInfo: typeof DEFAULT_SOUND_INFO;
    fetch: () => Promise<void>;
    release: () => void;
}


export class RemoteSampleBuffer implements RemoteSoundData {
    url: string;
    fetchStatus: PromiseStatus;
    soundInfo: typeof DEFAULT_SOUND_INFO;
    private buffer: StereoSampleQueue;
    private decoder: MPEGDecoderWebWorker;
    private fetching: boolean;
    constructor(url: string, bufferSize: number) {
        this.url = url;
        this.buffer = new StereoSampleQueue(bufferSize);
        this.decoder = new MPEGDecoderWebWorker();
        this.fetching = false;
        this.soundInfo = DEFAULT_SOUND_INFO;
        this.fetchStatus = new PromiseStatus();
    }

    async fetch() {
        const [ response ] = await Promise.all([
            fetch(this.url),
            this.decoder.ready
        ]);
        console.log('response', response);
        this.fetchStatus.resolve();

        if (response.body === null) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();

        await this.decoder.ready;
        this.fetching = true;
        while (this.fetching) {
            const { done, value } = await reader.read();
            if (done) break;
            const { channelData, sampleRate } = await this.decoder.decode(value);
            this.soundInfo.sampleRate = sampleRate;
            const [ left, right ] = channelData;
            await this.buffer.add(left, right);
        }
    }

    retrieve(requestedSize: number) {
        return this.buffer.retrieve(requestedSize);
    }

    release() {
        this.fetching = false;
        this.decoder.free();
    }
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
            console.error(`${this.filename} has already been fetched`);
        }

        try {
            const response = await fetch(this.url)
            const buffer = await response.arrayBuffer();
            const responseData = new Uint8Array(buffer);
            this.length = buffer.byteLength;

            console.log(this.filename);

            // Write buffer to local file using this completely undocumented emscripten function :)
            FMOD.FS_createDataFile('/', this.filename, responseData, canRead, canWrite, canOwn);
            this.fetchStatus.resolve();
        } catch (error) {
            console.error(error);
            this.fetchStatus.reject(error);
        }
    }

    release() {
        FMOD.unlink(`/${this.filename}`);
        this.fetchStatus = new PromiseStatus();
    }
}
