import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import Toggle from './Toggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRadio } from '@fortawesome/free-solid-svg-icons';
import Drag, { PositionUpdater } from './Drag';
import { usePlayQueue } from './PlayQueueProvider';

const Effects: React.FC = () => {
    const fmod = useFMOD();

    const [playQueue, _] = usePlayQueue();

    const [effects, setEffects] = useState({
        radio: false,
        pitchWobble: false,
        distortion: false,
    });

    const toggleRadio = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.radio.start();
        } else {
            fmod.events.radio.stop(0);
        }
        setEffects({ ...effects, radio: pressed });
    };

    const toggleWobble = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.pitchWobble.start();
        } else {
            fmod.events.pitchWobble.stop(0);
        }
        setEffects({ ...effects, pitchWobble: pressed });
    };

    const toggleDist = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.distortion.start();
        } else {
            fmod.events.distortion.stop(0);
        }
        setEffects({ ...effects, distortion: pressed });
    };

    const updateRadioPosition: PositionUpdater = (position) => {
        const pan = (-2 * position.x) / window.innerWidth;
        const distance = 0.5 + -position.y / window.innerHeight;
        fmod.events.radio.setParameter('RadioPan', pan, false);
        fmod.events.radio.setParameter('RadioNearness', distance, false);
    };

    return (
        <div className="flex flex-col items-center justify-center h-[200px]">
            <div>
                <div className="flex flex-row m-4">
                    <Toggle action={toggleRadio} />
                    <p
                        className="mx-4"
                        style={{
                            color: effects.radio ? 'white' : 'grey',
                        }}
                    >
                        small radio
                    </p>
                </div>
                <div className="flex flex-row m-4">
                    <Toggle action={toggleWobble} />
                    <p
                        className="mx-4"
                        style={{
                            color: effects.pitchWobble ? 'white' : 'grey',
                        }}
                    >
                        pitch wobble
                    </p>
                </div>
                <div className="flex flex-row m-4">
                    <Toggle action={toggleDist} />
                    <p
                        className="mx-4"
                        style={{
                            color: effects.distortion ? 'white' : 'grey',
                        }}
                    >
                        distortion
                    </p>
                </div>
            </div>
            {effects.radio && (
                <Drag onPositionUpdate={updateRadioPosition}>
                    <div
                        style={{
                            alignSelf: 'end',
                            transform:
                                'translateY(calc(-0.2 * var(--beat-pulse)))',
                        }}
                    >
                        <FontAwesomeIcon
                            icon={faRadio}
                            color={'grey'}
                            size="xl"
                        />
                    </div>
                </Drag>
            )}
        </div>
    );
};

export default Effects;
