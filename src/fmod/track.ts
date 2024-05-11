import { FMOD } from './system';
import { SliderState } from './sliderState';
import { Bank, LoadingState } from './bank';
import { EventInstance } from './event';
import { beatAnimation } from './callbacks';

export class Track {
    private bankURL: string;

    public name: string;
    public displayName: string;
    public averageSliderState: SliderState;
    public event: EventInstance;
    public bank: Bank;
    public changed = false;

    constructor(name: string, displayName: string, averageSliderState: SliderState) {
        this.name = name;
        this.displayName = displayName;
        this.bankURL = `./fmod/build/desktop/${this.name}.bank`;
        this.bank = new Bank(this.name, `./fmod_banks/${this.name}.bank`);
        this.averageSliderState = averageSliderState;
        this.event = new EventInstance(`event:/Tracks/${this.name}`);
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return (this.event != null) && (this.bank != null) && (this.bank.loadingState == LoadingState.LOADED);
    }
    
    // Requires no FMOD functions
    fetch() {
        this.bank.fetch();
    }

    async load() {
        await this.bank.load();

        // Load the track event which is now available because of the newly loaded bank.
        this.event.init();
        this.event.load();
        FMOD.Result = this.event.instance.setCallback(beatAnimation, FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT);
    }

    unload() {
        // Unload the track event if it's loaded
        if (this.event.isLoaded) {
            this.event.unload();
        }
        this.bank.unload();
        this.bank.loadingState = LoadingState.FETCHED;
    }
}
