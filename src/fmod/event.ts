import { FMOD } from './system';
import { Pointer } from './pointer';

// Supports a single instance
export class EventInstance {
    private path: string;

    public description: any;
    public instance: any;

    constructor(path: string) {
        this.path = path;
        this.description = null;
        this.instance = null;
    }

    get isLoaded(): boolean {
        if (this.instance === null) return false;
        const outval = new Pointer<number>();
        FMOD.Result = this.description.getSampleLoadingState(outval);
        if (outval.deref() !== FMOD.STUDIO_LOADING_STATE_LOADED) {
            return false;
        }
        return true;
    }

    init() {
        const outval = new Pointer<any>();
        FMOD.Result = FMOD.Studio.getEvent(this.path, outval);
        this.description = outval.deref();
    }

    load() {
        const outval = new Pointer<any>();

        // Create an event instance from our event description
        FMOD.Result = this.description.createInstance(outval);

        // Point the instance property to our newly created event instance
        this.instance = outval.deref();
    }

    get playbackState(): 'playing' | 'sustaining' | 'stopped' | 'starting' | 'stopping' {
        const outval = new Pointer<number>();
        this.instance.getPlaybackState(outval);
        switch (outval.deref()) {
            case FMOD.STUDIO_PLAYBACK_PLAYING:
                return 'playing';
            case FMOD.STUDIO_PLAYBACK_SUSTAINING:
                return 'sustaining';
            case FMOD.STUDIO_PLAYBACK_STOPPED:
                return 'stopped';
            case FMOD.STUDIO_PLAYBACK_STARTING:
                return 'starting';
            case FMOD.STUDIO_PLAYBACK_STOPPING:
                return 'stopped';
        }
        return 'stopped';
    }

    start() {
        FMOD.Result = this.instance.start();
    }

    stop(stoppingMode: number) {
        FMOD.Result = this.instance.stop(stoppingMode);
    }

    setPaused(paused: boolean) {
        FMOD.Result = this.instance.setPaused(paused);
    }


    getParameter(name: string): number {
        const outval = new Pointer<number>();
        FMOD.Result = this.instance.getParameterByName(name, {} as any, outval);
        return outval.deref();
    }

    setParameter(name: string, value: number, immediate: boolean) {
        console.log(`setting parameter ${name}, ${value}`);
        FMOD.Result = this.instance.setParameterByName(name, value, immediate);
    }

    setCallback(callbackMask: number, callback: (type: number, event: any, parameters: any) => number) {
        FMOD.Result = this.instance.setCallback(callback, callbackMask);
    }

    setPan(pan: number): number {
        const outval = new Pointer<any>();
        FMOD.Result = this.instance.getChannelGroup(outval);
        const group = outval.deref();
        return group.setPan(pan);
    }

    // Unloads the instance once playing has stopped
    unload() {
        FMOD.Result = this.instance.release() ;
        this.instance = null;
    }

    // A helper function which loads the event, plays it once, and immediately unloads it
    oneShot() {
        this.load();
        this.start();
        this.unload();
    }
}
