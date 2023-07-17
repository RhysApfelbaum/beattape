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
        let outval = {};

        try {
            // The loaded bank handle MUST BE STORED IN this.bankHandle otherwise no sound plays.
            // WHAT??!!?!?!

            /* Bill

            If you do not keep the handle in memory and refereneced then the bank file will be lost, because js will see that the handle is no longer used,
            and will then remove any reference to data for that handle. (Cannot find the source JS for the `gSystem.loadBankFile` call but most likely the
            handle may have all of the file details and data)

            Since you have two references to the bank Object, `bank` and  `bankHandle`. I would move the `bankHandle` into the Bank class
            so you can still obtain the bankHandle by doing `bank.handle`. This would also mean that the returned handle will be retained within the Bank object.

            so to load:

                await this.bank.load()

            or
                const handle = await this.bank.load()

            to get the handle in the future..

                console.log('bank handle is: {bank.handle}`)

            to unload a bank:

                this.bank.unload()

            */

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

        // Unload the bank
        this.bankHandle.unload();
        this.bankHandle = null;

        this.bank.loadingState = LOADING_STATE.FETCHED;
    }
}
