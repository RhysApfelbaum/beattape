class SingleInstanceEvent {
    description = null;
    instance = null;
    constructor(system, path) {
        let outval = {};
        CHECK_RESULT( system.getEvent(path, outval) );
        this.description = outval.val;
        return FMOD.OK;
    }

    get isLoaded() {
        return this.instance != null;
    }

    load() {
        let outval = {};

        // Create an event instance from our event description
        CHECK_RESULT( this.description.createInstance(outval) );

        // Point the instance property to our newly created event instance
        this.instance = outval.val;

        return FMOD.OK
    }

    unload() {
        // Mark the event instance for destruction
        CHECK_RESULT( this.instance.release() );

        // Point instance to null
        this.instance = null;
        return FMOD.OK;
    }

    // Loads the event, plays it once, and immediately unloads it
    oneShot() {
        this.load();
        this.instance.start();
        this.instance.release();
        this.instance = null;
    }
}