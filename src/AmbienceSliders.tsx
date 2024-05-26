import React, { useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';
import { useFMOD } from './FMODProvider';
import Toggle from './Toggle';
import styled from 'styled-components';

const AmbienceContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, 100px);
    grid-template-rows: 150px 50px;
    justify-content: center;
    justify-items: center;
    width: 300px;
    height: 400px;
    margin-top: 10px;
`;

const AmbienceSliders: React.FC = () => {
    const fmod = useFMOD();

    const [ ambience, setAmbience ] = useState({
        rain: false,
        vinyl: false,
        birds: false
    });

    console.log(ambience);

    const updateRain = (value: number) => {
        if (fmod.events.rain.playbackState !== 'playing') return;
        fmod.events.rain.setParameter('RainAmount', value, false);
    };
    const updateVinyl = (value: number) => {
        if (fmod.events.vinyl.playbackState !== 'playing') return;
        fmod.events.vinyl.setParameter('VinylAmount', value, false);
    };
    const updateBirds = (value: number) => {
        if (fmod.events.birds.playbackState !== 'playing') return;
        fmod.events.birds.setParameter('BirdAmount', value, false);
    };

    const toggleRain = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.rain.start();
        } else {
            fmod.events.rain.stop(0);
        }
        setAmbience({ ...ambience, rain: pressed });
    };

    const toggleBirds = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.birds.start();
        } else {
            fmod.events.birds.stop(0);
        }
        setAmbience({ ...ambience, birds: pressed });
    };

    const toggleVinyl = (pressed: boolean) => {
        fmod.events.tapeStop.oneShot();
        if (pressed) {
            fmod.events.vinyl.start();
        } else {
            fmod.events.vinyl.stop(0);
        }
        setAmbience({ ...ambience, vinyl: pressed });
    };

    return (
        <AmbienceContainer>
            <Slider update={updateRain} label="rain" activation={ ambience.rain ? '100%' : '0%'}/>
            <Slider update={updateVinyl} label="vinyl crackle"  activation={ ambience.vinyl ? '100%' : '0%'}/>
            <Slider update={updateBirds} label="birds chirping"  activation={ ambience.birds ? '100%' : '0%'}/>
            <Toggle action={toggleRain}/>
            <Toggle action={toggleVinyl}/>
            <Toggle action={toggleBirds}/>
        </AmbienceContainer>
    );
};

export default AmbienceSliders;
