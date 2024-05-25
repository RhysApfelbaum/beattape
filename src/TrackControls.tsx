import React, { useEffect, useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import { LoadingState } from './fmod/bank';
import { useFMOD } from './FMODProvider';
import Button from './Button';

const TrackControls: React.FC = () => {

    const [ paused, setPaused ] = useState(true);
    const [ playQueue, setPlayQueue ] = usePlayQueue();
    const [ amountPoll, setAmountPoll ] = useState<Timer | null>(null);
    
    const fmod = useFMOD();

    useEffect(() => {
        updatePauseState(true);
    }, [paused]);

    useEffect(() => {
        updatePlayQueueLoading();

        if (amountPoll) {
            clearInterval(amountPoll);
        }

        // Poll the effectiveness of each slider and update the CSS variables.
        const interval = setInterval(() => {
            const grit = playQueue.currentTrack.event.getParameter('GritAmount');
            const brightness = playQueue.currentTrack.event.getParameter('BrightnessAmount');
            const chops = playQueue.currentTrack.event.getParameter('ChopsAmount');
            const vocals = playQueue.currentTrack.event.getParameter('VocalsAmount');
            
            if (fmod.ref?.current) {
                const style = fmod.ref.current.style;
                style.setProperty('--grit', `${grit * 100}%`); 
                style.setProperty('--brightness', `${brightness * 100}%`); 
                style.setProperty('--chops', `${chops * 100}%`); 
                style.setProperty('--vocals', `${vocals * 100}%`); 
            }
        }, 100);

        setAmountPoll(interval);
    }, [playQueue]);

    const updatePauseState = (tapestop: boolean) => {
        if (paused) {
            if (!tapestop) {
                playQueue.currentTrack.event.setPaused(true);
                return;
            }
            fmod.events.paused.start();

            // Tape stop effect jankery
            // This is awful. It polls intensity parameter in the FMOD snapshot every 50ms until it's 0.
            const intervalID = setInterval(() => {
                const intensity = fmod.events.paused.getParameter('Intensity');
                if (intensity >= 100) {
                    playQueue.currentTrack.event.setPaused(true);
                    clearInterval(intervalID);
                }
            }, 50);
        } else {
            playQueue.currentTrack.event.setPaused(false);
            if (tapestop) fmod.events.paused.stop(0);
        }
    };

    const updatePlayQueueLoading = async () => {
        if (playQueue.currentTrack.bank.loadingState === LoadingState.UNLOADED) {
            playQueue.currentTrack.fetch();
        }

        if (playQueue.nextTracks[0].bank.loadingState === LoadingState.UNLOADED) {
            playQueue.nextTracks[0].fetch();
        }

        for (let i = 1; i < playQueue.nextTracks.length; i++) {
            if (playQueue.nextTracks[i].bank.loadingState == LoadingState.LOADED) {
                playQueue.nextTracks[i].unload();
            }
        }

        switch (playQueue.currentTrack.bank.loadingState) {
            case LoadingState.UNLOADED:
            case LoadingState.FETCHED:
                await playQueue.currentTrack.load()
                break;
            case LoadingState.ERROR:
                console.error(`Error loading ${playQueue.currentTrack.name}`);
                break;
            case LoadingState.LOADED:
                break;
        }
        playQueue.currentTrack.event.start();
        updatePauseState(false)
    };

    const nextTrack = () => {
        fmod.events.tapeStop.oneShot();
        playQueue.currentTrack.event.stop(0);
        setPlayQueue({
            ...playQueue,
            history: [playQueue.currentTrack, ...playQueue.history],
            currentTrack: playQueue.nextTracks[0],
            nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
        });
    };

    const prevTrack = () => {
        fmod.events.tapeStop.oneShot();
        playQueue.currentTrack.event.stop(0);

        if (playQueue.history.length === 0) {
            playQueue.currentTrack.event.start();
            return;
        }

        setPlayQueue({
            ...playQueue,
            nextTracks: playQueue.history.length > 0
                ? [playQueue.currentTrack , ...playQueue.nextTracks]
                : playQueue.nextTracks,
            currentTrack: playQueue.history[0],
            history: playQueue.history.slice(1)
        });
    };

    const handlePause = () => {
        fmod.events.tapeStop.oneShot();
        setPaused(!paused);
    };

    return (
        <>
            <div style={{
                display: 'block'
            }}>
                <Button onClick={prevTrack}>prev</Button>
                <Button onClick={handlePause}>
                    <img src="pause.png" style={{
                        width: '2em',
                        height: '2em',
                        margin: '1em 1em 1em 1em',
                        boxShadow: 'none'
                    }}>
                        play/pause
                    </img>
                </Button>
                <Button onClick={nextTrack}>next</Button>
                <p>{playQueue.currentTrack.displayName}</p>
            </div>
            <br />
        </>
    );
};
            // <Slider update={updateGrit} activation="var(--grit)"/>
            // <br />
            // <Slider update={updateBrightness} activation="var(--brightness)"/>
            // <br />
            // <Slider update={updateChops} activation="var(--chops)"/>
            // <br />
            // <Slider update={updateVocals} activation="var(--vocals)"/>

export default TrackControls;
