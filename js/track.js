class Track {

    constructor(trackData) {
        this.name = trackData.name;
        this.displayName = trackData.displayName;
        this.eventPath = `event:/Tracks/${this.name}`;
        this.bankURL = `./fmod/build/desktop/${this.name}.bank`;
        this.event = null;
        this.bank = new Bank(this.name, `${FMOD_BUILD_FOLDER}/${this.name}.bank`);
        this.bankHandle = null;
        this.sliderData = {
            grit: trackData.grit,
            brightness: trackData.brightness,
            chops: trackData.chops,
            vocals: trackData.vocals 
        };
        this.changed = false;
        this.array;
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return (this.event != null) & (this.bank != null) & (this.bank.loadingState == LOADING_STATE.LOADED);
    }
    
    // Requires no FMOD functions
    fetch() {
        this.bank.fetch();
    }

    async load() {
        try {
            await this.bank.load();
            
            // Load the track event which is now available because of the newly loaded bank.
            this.event = new SingleInstanceEvent(gSystem, this.eventPath);
            this.event.load();
        } catch (error) {
            console.error(error);
        }
    }

    unload() {
        // Unload the track event if it's loaded
        if (this.event.isLoaded) {
            this.event.unload();
            this.event = null;
        }
        this.bank.unload();
        this.bank.loadingState = LOADING_STATE.FETCHED;
    }
}
