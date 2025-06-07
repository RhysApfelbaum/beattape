import { FMOD } from './system';
import { PromiseStatus } from './promiseStatus';
import { StereoSampleQueue, chunkBatcher } from './buffering';
import { MPEGDecodedAudio, MPEGDecoderWebWorker } from 'mpg123-decoder';


const DEFAULT_SOUND_INFO = {
    sampleRate: 44100,
    numChannels: 2,
    bytesPerSample: 2,
    bufferThreshold: 20
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
    canRestart: PromiseStatus;
    soundInfo: typeof DEFAULT_SOUND_INFO;
    private buffer: StereoSampleQueue;
    private decoder: MPEGDecoderWebWorker;
    private fetching: boolean;
    constructor(
        url: string,
        bufferSize: number,
        soundInfo = DEFAULT_SOUND_INFO
    ) {
        this.url = url;
        const buffer = new StereoSampleQueue(bufferSize);
        this.buffer = buffer;
        this.decoder = new MPEGDecoderWebWorker();
        this.fetching = false;
        this.soundInfo = soundInfo;
        this.fetchStatus = new PromiseStatus();
        this.canRestart = new PromiseStatus();
    }

    private get threshold() {
        const { sampleRate, bytesPerSample, numChannels, bufferThreshold } = this.soundInfo;
        return sampleRate * bytesPerSample * numChannels * bufferThreshold;
    }

    async fetch() {
        const [ response ] = await Promise.all([
            fetch(this.url),
            this.decoder.ready
        ]);
        this.fetchStatus.resolve();

        if (response.body === null) {
            throw new Error('No response body');
        }

        // const reader = response.body.getReader();

        const decoder = new MPEGDecoderWebWorker();


        const decodeStream = new TransformStream<Uint8Array, MPEGDecodedAudio>({
            start: async () => {
                await decoder.ready;
            },
            transform: async (chunk, controller) => {
                const start = performance.now();
                const decoded = await decoder.decode(chunk);
                controller.enqueue(decoded);
                const end = performance.now();
                console.log(`Decoded ${decoded.samplesDecoded} samples in ${(end - start).toFixed(2)} ms`);
            }
        });
        response.body
            .pipeThrough(chunkBatcher())
            .pipeThrough(decodeStream)
            .pipeTo(new WritableStream<MPEGDecodedAudio>({
                write: async (chunk) => {
                    const { channelData } = chunk;
                    const [ left, right ] = channelData;
                    // const size = await this.buffer.add(left, right);
                    // console.log('size', size);
                    // console.log(size, this.threshold, this.canRestart.status);
                    // if (size > this.threshold && !this.canRestart.isResolved) {
                    //     console.log('restarting');
                    //     this.canRestart.resolve();
                    // }
                }
            }));
        // this.fetching = true;
        // while (this.fetching) {
        //     const { done, value } = await reader.read();
        //     if (done) break;
        //     const { channelData, sampleRate } = await this.decoder.decode(value);
        //     this.soundInfo.sampleRate = sampleRate;
        //     const [ left, right ] = channelData;
        //     const size = await this.buffer.add(left, right);
        //     console.log(size, this.canRestart.status);
        //     if (size > this.threshold && !this.canRestart.isResolved) {
        //         console.log('restarting');
        //         this.canRestart.resolve();
        //     }
        // }
        await this.decoder.reset();
    }

    retrieve(requestedSize: number) {
        return this.buffer.retrieve(requestedSize);
    }

    async unload() {
        this.fetching = false;
        await this.decoder.reset();
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
