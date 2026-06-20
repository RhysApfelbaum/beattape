import { FMODMountedFile } from "./fmod/mountedFile";
import { Pointer } from "./fmod/pointer";
import { FMOD } from "./fmod/system";


export async function soundtest() {

    const response = await fetch('/downpour.fsb');
    const buff = await response.arrayBuffer();


    const file = new FMODMountedFile('/downpour.fsb', 'downpour.fsb')
    await file.fetch()

    // FMOD.FS_createDataFile(
    //     '/',
    //     'downpour.fsb',
    //     buff,
    //     true,
    //     false,
    //     false,
    // );

    const sound = new Pointer<any>();
    const subsound = new Pointer<any>();
    // const info = FMOD.CREATESOUNDEXINFO();
    //
    // info.length = this.source.length;
    // info.numchannels = 2;
    // info.defaultfrequency = 48000;
    // info.decodebuffersize = 48000;
    // info.format = FMOD.SOUND_FORMAT_PCM16;
    // info.suggestedsoundtype = FMOD.SOUND_TYPE_WAV;
    const mode = FMOD.LOOP_NORMAL;

    FMOD.Result = FMOD.Core.createStream(
        '/downpour.fsb',
        mode,
        null,
        sound,
    );
    const handle = sound.deref();
    handle.getSubSound(0, subsound);

    console.log('playing')
    FMOD.Result = FMOD.Core.playSound(subsound.deref(), null, true, {})
}
