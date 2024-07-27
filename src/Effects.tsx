import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import Toggle from './Toggle';
import styled, { useTheme } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRadio } from '@fortawesome/free-solid-svg-icons';
import Drag, { PositionUpdater } from './Drag';
import { usePlayQueue } from './PlayQueueProvider';

const EffectsContainer = styled.div`
    p {
        margin-left: 10px;
    }
`;

const Effects: React.FC = () => {
    const fmod = useFMOD();

    const theme = useTheme();
    const [ playQueue, _ ] = usePlayQueue();

    const [ effects, setEffects ] = useState({
        radio: false,
        pitchWobble: false,
        distortion: false
    });

    const flexRow: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'row'
    }

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

    const updateRadioPosition: PositionUpdater = position => {
        const pan = -2 * position.x / window.innerWidth;
        const distance = .5 + (-position.y / window.innerHeight);
        console.log(distance)
        fmod.events.radio.setParameter('RadioPan', pan, false);
        fmod.events.radio.setParameter('RadioNearness', distance, false);
    };

    return (
        <>
            <EffectsContainer>
                <div style={flexRow}>
                    <Toggle action={toggleRadio}/>
                    <p style={{
                        color: effects.radio ? 'white' : theme.colors.grey,
                        marginRight: 20
                    }}>small radio</p>
                    {
                        effects.radio &&
                            <Drag onPositionUpdate={updateRadioPosition}>
                                <div style={{
                                    alignSelf: 'end',
                                    transform: 'translateY(calc(-0.2 * var(--beat-pulse)))'
                                }}>
                                    <FontAwesomeIcon icon={faRadio} color={theme.colors.brightLight} size='xl'/>
                                </div>
                            </Drag>
                    }
                </div>
                <div style={flexRow}>
                    <Toggle action={toggleWobble}/>
                    <p style={{
                        color: effects.pitchWobble ? 'white' : theme.colors.grey
                    }}>pitch wobble</p>
                </div>
                <div style={flexRow}>
                    <Toggle action={toggleDist}/>
                    <p style={{
                        color: effects.distortion ? 'white' : theme.colors.grey
                    }}>distortion</p>
                </div>
            </EffectsContainer>
        </>
    );
};

export default Effects;
