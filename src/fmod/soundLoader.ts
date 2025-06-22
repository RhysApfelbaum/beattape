import { StaticSound, StreamedSound } from "./sound";

export interface SoundInfo {
    path: string;
    start: number;
    end: number;
}

const pathToTrackURL = (path: string) => `./track_audio/${path}`;

export class SoundLoader {
    private sounds: StreamedSound[];

    constructor() {
        this.sounds = [];
    }

    // TODO: type this properly
    addSoundInfo(soundInfo: any) {
        soundInfo.forEach((item: any) => {
            const path = pathToTrackURL(item.path);
            const localPath = item.path.split('/').pop();
            // const sound = new StaticSound(path, localPath, item.start, item.end);
            const stream = new StreamedSound(path, item.start, item.end, item.length);
            this.sounds.push(stream);
        });
    }

    async load(time = 0) {
        const promises = this.sounds.map(sound => {
            sound.fetch();
            return sound.load();
        })

        await Promise.all(promises);
    }

    getSound(path: string) {
        let newPath = path;
        // HACK
        if (path.endsWith('.wav')) {
            newPath = path.replace('.wav', '.mp3');
        }
        for (const sound of this.sounds) {
            if (sound.url === pathToTrackURL(newPath)) {
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
