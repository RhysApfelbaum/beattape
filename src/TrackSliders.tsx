import React from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';

const TrackSliders: React.FC = () => {

    const [ playQueue, _ ] = usePlayQueue();

    const updateGrit = (value: number) => {
        playQueue.currentTrack.event.setParameter('Grit', value, false);
    };
    const updateBrightness = (value: number) => {
        playQueue.currentTrack.event.setParameter('Brightness', value, false);
    };
    const updateChops = (value: number) => {
        playQueue.currentTrack.event.setParameter('Chops', value, false);
    };
    const updateVocals = (value: number) => {
        playQueue.currentTrack.event.setParameter('Vocals', value, false);
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
            <Slider update={updateGrit} label="grit" activation="var(--grit)"/>
            <Slider update={updateBrightness} label="brightness"  activation="var(--brightness)"/>
            <Slider update={updateChops} label="chops"  activation="var(--chops)"/>
            <Slider update={updateVocals} label="vocals"  activation="var(--vocals)"/>
        </div>
    );
};

export default TrackSliders;
