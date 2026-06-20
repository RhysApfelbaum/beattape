import { FMODMountedFile } from "./fmod/mountedFile";
import { Pointer } from "./fmod/pointer";
import { StaticSound } from "./fmod/sound";
import { FMOD } from "./fmod/system";


export async function soundtest() {

    // const response = await fetch('/downpour.fsb');
    // const buff = await response.arrayBuffer();

    const sound = new StaticSound('./track_audio/bubbles/main.ogg', 'main.ogg', 0, 12345);

    // const file = new FMODMountedFile('/downpour.fsb', 'downpour.fsb')
    // await file.fetch()

    // const sound = new Pointer<any>();
    // const subsound = new Pointer<any>();
    // const info = FMOD.CREATESOUNDEXINFO();
    // const mode = FMOD.LOOP_NORMAL;
    //
    // FMOD.Result = FMOD.Core.createStream(
    //     '/main2.',
    //     mode,
    //     info,
    //     sound,
    // );
    // const handle = sound.deref();
    // handle.getSubSound(0, subsound);
    await sound.fetch();
    sound.load();
    console.log(sound.handle);

    console.log('playing')
    FMOD.Result = FMOD.Core.playSound(sound.handle, null, false, {})
}
