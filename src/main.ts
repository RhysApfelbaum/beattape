import './fmod/fmodstudio.wasm';
import FMODModule from './fmod/fmodstudio.js';
import { FMOD } from './fmod/system';
import { Bank } from './fmod/bank';
import { Pointer } from './fmod/pointer';
import './css/test.css';

FMOD.onSystemInitialized = async () => {
    const master = new Bank('Master', '/fmod_banks/Master.bank');

    const strings = new Bank('Master.strings', '/fmod_banks/Master.strings.bank');

    const test = new Bank('court', '/fmod_banks/doomscroll.bank');
    strings.fetch();
    master.fetch();
    test.fetch();
    await master.load();
    await strings.load();
    await test.load();

    const outval = new Pointer<any>();
    FMOD.Result = FMOD.Studio.getEvent('event:/Tracks/doomscroll', outval);
    const desc = outval.deref();
    FMOD.Result = desc.createInstance(outval);

    let anim: CSSAnimation;

    document.getAnimations().forEach((a: CSSAnimation) => {
        console.log(a);
        if (a.animationName === 'beat') {
            anim = a;
        }
    });

    const inst = outval.deref();
    
    let loopBeats = 0;
    let looping = true;
    let loopPosition = 0;
    const callback = (type: number, event: any, parameters: any): number => {
        const e = document.querySelector('h1');
        anim.cancel();
        anim.play();
        return FMOD.OK;
    };
    FMOD.Result = inst.setCallback(callback, FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT);
    inst.start();



    window.setInterval(() => {
        FMOD.Result = FMOD.Studio.update();
    }, 20)
};

FMODModule(FMOD);
