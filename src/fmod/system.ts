import { Pointer } from './pointer';

// This way madness lies.
// This whole thing is a giant HACK
export const FMOD: any = {
    preRun: () => {},
    onSystemInitialized: () => {},
    async onRuntimeInitialized() {
        const outval = new Pointer<any>();
        const sampleRate = new Pointer<number>();

        FMOD.Studio_System_Create(outval);
        FMOD.Studio = outval.deref();
        FMOD.Result = FMOD.Studio.getCoreSystem(outval);
        FMOD.Core = outval.deref();

        // Optional. Setting DSP Buffer size can affect latency and stability.
        // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
        FMOD.Result = FMOD.Core.setDSPBufferSize(2048, 2);
        
        // Optional. Set sample rate of mixer to be the same as the OS output rate.
        // This can save CPU time and latency by avoiding the automatic insertion of a resampler at the output stage.
        FMOD.Result = FMOD.Core.getDriverInfo(0, null, null, sampleRate, null, null);
        FMOD.Result = FMOD.Core.setSoftwareFormat(sampleRate.deref(), FMOD.SPEAKERMODE_DEFAULT, 0)

        // 1024 virtual channels
        FMOD.Result = FMOD.Studio.initialize(32, FMOD.STUDIO_INIT_NORMAL, FMOD.INIT_NORMAL, null);
        FMOD.onSystemInitialized();
    },
    set Result(code: number) {
        if (code === 0 || FMOD.ErrorString === undefined) {
            return;
        };
        throw new Error(`FMOD failed with code ${code}: ${FMOD.ErrorString(code)}`);
    },
    Studio: {} as any,
    Core: {} as any,
    INITIAL_MEMORY: 16 * 1024 * 1024
};
