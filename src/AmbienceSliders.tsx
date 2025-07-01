import React, { useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';
import { useFMOD } from './FMODProvider';
import Toggle from './Toggle';


const AmbienceSliders: React.FC = () => {
    const fmod = useFMOD();

    const [ ambience, setAmbience ] = useState({
        rain: false,
        vinyl: false,
        birds: false
    });

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
        <div className='flex w-full items-center '>
            <div className="w-[33%] flex flex-col items-center">
                <Slider
                    update={updateRain}
                    label="rain"
                    activation={ ambience.rain ? '100%' : '0%'}
                />
                <Toggle action={toggleRain}/>
            </div>
            <div className="w-[33%] flex flex-col items-center">
                <Slider
                    update={updateVinyl}
                    label="vinyl crackle"
                    activation={ ambience.vinyl ? '100%' : '0%'}
                />
                <Toggle action={toggleVinyl}/>
            </div>
            <div className="w-[33%] flex flex-col items-center">
                <Slider
                    update={updateBirds}
                    label="birds chirping"
                    activation={ ambience.birds ? '100%' : '0%'}
                />
                <Toggle action={toggleBirds}/>
            </div>
        </div>
    );
};

export default AmbienceSliders;
