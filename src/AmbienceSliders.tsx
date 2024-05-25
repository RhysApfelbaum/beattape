import React from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';
import { useFMOD } from './FMODProvider';

const AmbienceSliders: React.FC = () => {

    const [ playQueue, _ ] = usePlayQueue();
    const fmod = useFMOD();

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
        fmod.events.birds.setParameter('BirdsAmount', value, false);
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 100px)',
            gridTemplateRows: '100px',
            justifyContent: 'center',
            justifyItems: 'center',
            width: '450px',
            height: '150px', 
            marginTop: '10px',
        }}>
            <Slider update={updateRain} label="rain" activation="0%"/>
            <Slider update={updateVinyl} label="vinyl"  activation="0%"/>
            <Slider update={updateBirds} label="birds chirping"  activation="0%"/>
        </div>
    );
};

export default AmbienceSliders;
