import { SliderState } from './sliderState';
import { Bank } from './bank';
import { EventInstance } from './event';
import { SoundInfo, SoundLoader } from './soundLoader';
import soundSchema from '../soundSchema.json';

export class Track {

    public name: string;
    public displayName: string;
    public averageSliderState: SliderState;
    public event: EventInstance;
    public bank: Bank;
    public changed = false;
    public sounds: SoundLoader;

    constructor(name: string, displayName: string, averageSliderState: SliderState) {
        this.name = name;
        this.displayName = displayName;
        this.bank = new Bank(this.name, `./fmod_banks/${this.name}.bank`);
        this.averageSliderState = averageSliderState;
        this.event = new EventInstance(`event:/Tracks/${this.name}`);
        this.sounds = new SoundLoader();
        this.sounds.addSoundInfo((soundSchema as any)[this.name] || []);
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return (this.event != null) && (this.bank != null) && (this.bank.getStatus().status === 'loaded');
    }

    // Requires no FMOD functions
    async fetch() {
        await this.bank.fetch();
        this.sounds.fetch();
    }

    async load() {
        await this.bank.load();

        // Load the track event which is now available because of the newly loaded bank.
        this.event.init();
        this.event.load();
    }

    unload() {
        // Unload the track event if it's loaded
        if (this.event.isLoaded) {
            this.event.unload();
        }
        this.bank.unload();
    }
}
