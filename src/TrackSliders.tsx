import React from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';

const TrackSliders: React.FC = () => {

    const [ playQueue, setPlayQueue ] = usePlayQueue();

    const updateGrit = (value: number) => {
        // if (!playQueue.currentTrack.isLoaded) return;
        playQueue.currentTrack.event.setParameter('Grit', value, false);
        console.log('success');
    };
    const updateBrightness = (value: number) => {
        if (!playQueue.currentTrack.isLoaded) return;
        playQueue.currentTrack.event.setParameter('Brightness', value, false);
    };
    const updateChops = (value: number) => {
        if (!playQueue.currentTrack.isLoaded) return;
        playQueue.currentTrack.event.setParameter('Chops', value, false);
    };
    const updateVocals = (value: number) => {
        if (!playQueue.currentTrack.isLoaded) return;
        playQueue.currentTrack.event.setParameter('Vocals', value, false);
    };

    const updateSliderStateGrit = (value: number) => {
        setPlayQueue({
            ...playQueue,
            sliderState: {
                ...playQueue.sliderState,
                grit: value
            }
        });
    };

    const updateSliderStateBrightness = (value: number) => {
        setPlayQueue({
            ...playQueue,
            sliderState: {
                ...playQueue.sliderState,
                brightness: value
            }
        });
    };

    const updateSliderStateChops = (value: number) => {
        setPlayQueue({
            ...playQueue,
            sliderState: {
                ...playQueue.sliderState,
                chops: value
            }
        });
    };

    const updateSliderStateVocals = (value: number) => {
        setPlayQueue({
            ...playQueue,
            sliderState: {
                ...playQueue.sliderState,
                vocals: value
            }
        });
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
            <Slider 
                update={updateGrit}
                label="grit"
                activation="var(--grit)"
                onMouseUp={updateSliderStateGrit}
            />
            <Slider
                update={updateBrightness}
                label="brightness"
                activation="var(--brightness)"
                onMouseUp={updateSliderStateBrightness}
            />
            <Slider
                update={updateChops}
                label="chops"
                activation="var(--chops)"
                onMouseUp={updateSliderStateChops}
            />
            <Slider
                update={updateVocals}
                label="vocals"
                activation="var(--vocals)"
                onMouseUp={updateSliderStateVocals}
            />
        </div>
    );
};

export default TrackSliders;
