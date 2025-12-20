import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import Toggle from './Toggle';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRadio } from '@fortawesome/free-solid-svg-icons';
import Drag, { PositionUpdater } from './Drag';
import Slider from './components/Slider';

const LiveRadio: React.FC = () => {
    const fmod = useFMOD();


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


    const updateRadioPosition: PositionUpdater = (position) => {
        const pan = (-2 * position.x) / window.innerWidth;
        const distance = 0.5 + -position.y / window.innerHeight;
        fmod.events.radio.setParameter('RadioPan', pan, false);
        fmod.events.radio.setParameter('RadioNearness', distance, false);
    };

    return (
        <div className="flex w-full items-center ">
            <div className="w-[33%] flex flex-col items-center">
                <Slider
                    update={() => {}}
                    label="volume"
                    activation={'0%'}
                />
                <Toggle action={toggleRadio} />
            </div>
            <div className="w-[66%] flex flex-col items-center">
                <label htmlFor="radio-url"><h2>Stream URL</h2></label>
                <input id="radio-url" type="url"/>
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

export default LiveRadio;
