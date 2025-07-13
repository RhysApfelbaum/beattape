import { FMOD } from './system';

export type FMODCallback = (
    type: number,
    event: any,
    parameters: any,
) => number;

export const beatAnimation: FMODCallback = (type, event, parameters) => {
    let anim: CSSAnimation;
    document.getAnimations().forEach((a: CSSAnimation) => {
        if (a.animationName === 'beat') {
            anim = a;
        }
    });
    if (anim === undefined) {
        return;
    }
    anim.cancel();
    anim.play();
    return FMOD.OK;
};
