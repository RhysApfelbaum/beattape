import { StaticSound, StreamedSound } from "./sound";

export interface SoundInfo {
    path: string;
    start: number;
    end: number;
}

const pathToTrackURL = (path: string) => `./track_audio/${path}`;

export class SoundLoader {
    private sounds: StreamedSound[];
    private threshold: number;
    private fetched: StreamedSound[];

    constructor() {
        this.sounds = [];
        this.fetched = [];
        this.threshold = 0;
    }

    // TODO: type this properly
    addSoundInfo(soundInfo: any) {
        soundInfo.forEach((item: any) => {
            const path = pathToTrackURL(item.path);
            const stream = new StreamedSound(path, item.start, item.end, item.length, item.sampleRate);
            this.sounds.push(stream);
            this.sounds.sort((a, b) => a.start - b.start );
        });
    }

    async load(time = 0, offset = 10) {
        this.sounds.map(sound => {
            if (sound.isLoaded) {
                // sound.updateTime(0)
                sound.updateDecoderPosition(time);
            } 
        })

        if (time < this.threshold) return;
        console.log(time, this.threshold);
        const promises = this.sounds.map(sound => {

            if (
                sound.start > time + offset ||
                sound.start < this.threshold
            ) {
                if (sound.end < this.threshold && sound.isLoaded) {
                    sound.unload();
                }
                return null;
            }


            if (this.fetched.includes(sound)) {
                return null;
            }

            console.log('loading', sound.url, sound.start);
            this.fetched.push(sound);
            sound.fetch();
            return sound.load();
        });
        this.threshold = time + offset / 2;

        console.log(promises);
        await Promise.all(promises);
    }

    async unload() {
        await Promise.all(this.sounds.map(sound => {
            if (sound.isLoaded) {
                return sound.unload();
            }
        }));
    }

    getSound(path: string) {
        let newPath = path;
        // HACK
        console.log(newPath);
        for (const sound of this.sounds) {
            if (sound.url === pathToTrackURL(newPath)) {
                return sound;
            }
        }

        throw new Error(`Could not find sound: ${newPath}`);
    }

    bufferLength(start: number = 0) {
        for (const sound of this.sounds) {
            if (sound.start < start) continue;
            if (!sound.isLoaded) {
                return sound.start;
            }
        }
        return 1000;
    }

}
