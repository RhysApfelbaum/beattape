import { StaticSound } from "./sound";

export interface SoundInfo {
    path: string;
    start: number;
    end: number;
}

const pathToTrackURL = (path: string) => `./track_audio/${path}`;

export class SoundLoader {
    private sounds: StaticSound[];

    constructor() {
        this.sounds = [];

    }

    // TODO: type this properly
    addSoundInfo(soundInfo: any) {
        soundInfo.forEach((item: any) => {
            const path = pathToTrackURL(item.path);
            const localPath = item.path.split('/').pop();
            const sound = new StaticSound(path, localPath, item.start, item.end);
            this.sounds.push(sound);
        });
        console.log(this.sounds);
    }

    fetch() {
        this.sounds.forEach(async (sound) => {
            await sound.fetch();
            if (sound.source.fetchStatus.isRejected) {
                console.error('something went wrong');
                // throw sound.error;
                // TODO: Figure this out
                throw new Error();
            }
            sound.load();
        })
    }

    getSound(path: string) {
        for (const sound of this.sounds) {
            if (sound.source.url === pathToTrackURL(path)) {
                return sound;
            }
        }

        throw new Error(`Could not find sound: ${path}`);
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
