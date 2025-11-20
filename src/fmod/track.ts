import { SliderState } from './sliderState';
import { Bank } from './bank';
import { EventInstance } from './event';
import { SoundInfo, SoundLoader } from './soundLoader';
import soundSchema from '../soundSchema.json';

const mix = (amount: number) => `${(1 - (amount - 1) * (amount - 1)) * 100}%`;

export class Track {
    public name: string;
    public displayName: string;
    public averageSliderState: SliderState;
    public event: EventInstance;
    public bank: Bank;
    public changed = false;
    public sounds: SoundLoader;

    private interval: Timer | null;

    constructor(
        name: string,
        displayName: string,
        averageSliderState: SliderState,
    ) {
        this.name = name;
        this.displayName = displayName;
        this.bank = new Bank(this.name, `./fmod_banks/${this.name}.bank`);
        this.averageSliderState = averageSliderState;
        this.event = new EventInstance(`event:/Tracks/${this.name}`);
        this.sounds = new SoundLoader();
        this.sounds.addSoundInfo((soundSchema as any)[this.name] || []);
        this.interval = null;
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return this.event.isLoaded;
    }

    async load() {
        await this.bank.fetch();
        await Promise.all([
            this.sounds.load(),
            this.bank.load()
        ]);

        this.event.init(); // must be called every time
        this.event.load();

        this.interval = setInterval(() => {
            if (!this.event.isLoaded) return;
            const grit = this.event.getParameter('GritAmount');
            const brightness =
                this.event.getParameter('BrightnessAmount');
            const chops = this.event.getParameter('ChopsAmount');
            const vocals = this.event.getParameter('VocalsAmount');

            const style = document.documentElement.style;
            style.setProperty('--grit', mix(grit));
            style.setProperty('--brightness', mix(brightness));
            style.setProperty('--chops', mix(chops));
            style.setProperty('--vocals', mix(vocals));
        }, 100);
    }

    unload() {
        // Unload the track event if it's loaded
        this.event.unload();
        this.bank.unload();
        if (this.interval) {
            clearInterval(this.interval);
        }
        return this.sounds.unload();
    }
}
