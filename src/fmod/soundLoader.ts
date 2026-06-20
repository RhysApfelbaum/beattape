import { dbg } from './helpers';
import { StaticSound, StreamedSound } from './sound';
import { FMOD } from './system';

export interface SoundInfo {
    path: string;
    start: number;
    end: number;
}

const pathToTrackURL = (path: string) => `./track_audio/${path}`;

export class SoundLoader {
    private sounds: StaticSound[];
    private threshold: number;
    private fetched: StaticSound[];

    constructor() {
        this.sounds = [];
        this.fetched = [];
        this.threshold = 0;
    }

    // TODO: type this properly
    addSoundInfo(soundInfo: any) {
        soundInfo.forEach((item: any) => {
            const path = pathToTrackURL(item.path);
            const filename = path.split('/').pop()!;
            console.log(path, filename);
            const stream = new StaticSound(
                path,
                filename,
                item.start,
                item.end,
            );
            // const stream = new StreamedSound(
            //     path,
            //     item.start,
            //     item.end,
            //     item.length,
            //     item.sampleRate,
            // );
            this.sounds.push(stream);
            this.sounds.sort((a, b) => a.start - b.start);
        });
    }

    async load(time = 0, offset = 10) {
        if (time < this.threshold) return;
        const promises = this.sounds.map(async (sound) => {
            if (sound.start > time + offset || sound.start < this.threshold) {
                if (sound.end < this.threshold && sound.isLoaded) {
                    sound.unload();
                }
                return null;
            }

            if (this.fetched.includes(sound)) {
                return null;
            }

            await sound.fetch();
            this.fetched.push(sound);

            sound.load();
        });
        this.threshold = time + offset / 2;

        await Promise.all(promises);
    }

    async unload() {
        dbg('unloading sounds');
        console.log(FMOD);
        this.fetched = [];
        this.threshold = 0;
        await Promise.all(
            this.sounds.map(async sound => {
                dbg(sound.source.url, sound.isLoaded)
                if (sound.isLoaded) {
                    await sound.unload();
                }
                sound.release();
            }),
        );
    }

    getSound(path: string) {
        console.log('get', path);
        let newPath = path.replace('mp3', 'ogg');
        for (const sound of this.sounds) {
            if (sound.source.url === pathToTrackURL(newPath)) {
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
