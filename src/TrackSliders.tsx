import React, { useEffect } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import Slider from './components/Slider';

const TrackSliders: React.FC = () => {
    const [playQueue, dispatch] = usePlayQueue();

    // useEffect(() => {
    //     updateGrit(playQueue.sliderState.grit);
    //     updateBrightness(playQueue.sliderState.brightness);
    //     updateChops(playQueue.sliderState.chops);
    //     updateVocals(playQueue.sliderState.vocals);
    //
    //     dispatch({
    //         type: 'SET_SLIDER_STATE',
    //         sliderState: playQueue.sliderState
    //     })
    // }, []);

    const updateGrit = (value: number) => {
        if (!playQueue.currentTrack.isLoaded) return;
        playQueue.currentTrack.event.setParameter('Grit', value, false);
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
        dispatch({ type: 'SET_SLIDER_STATE', sliderState: {
            ...playQueue.sliderState,
            grit: value
        }});
    };

    const updateSliderStateBrightness = (value: number) => {
        dispatch({ type: 'SET_SLIDER_STATE', sliderState: {
            ...playQueue.sliderState,
            brightness: value
        }});
    };

    const updateSliderStateChops = (value: number) => {
        dispatch({ type: 'SET_SLIDER_STATE', sliderState: {
            ...playQueue.sliderState,
            chops: value
        }});
    };

    const updateSliderStateVocals = (value: number) => {
        dispatch({ type: 'SET_SLIDER_STATE', sliderState: {
            ...playQueue.sliderState,
            vocals: value
        }});
    };

    return (
        <div className="flex m-5">
            <Slider
                update={updateGrit}
                label="grit"
                activation="var(--grit)"
                onMouseUp={updateSliderStateGrit}
                className="w-[25%]"
            />
            <Slider
                update={updateBrightness}
                label="brightness"
                activation="var(--brightness)"
                onMouseUp={updateSliderStateBrightness}
                className="w-[25%]"
            />
            <Slider
                update={updateChops}
                label="chops"
                activation="var(--chops)"
                onMouseUp={updateSliderStateChops}
                className="w-[25%]"
            />
            <Slider
                update={updateVocals}
                label="vocals"
                activation="var(--vocals)"
                onMouseUp={updateSliderStateVocals}
                className="w-[25%]"
            />
        </div>
    );
};

export default TrackSliders;
