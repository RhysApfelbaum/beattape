import React, { useEffect, useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import { LoadingState } from './fmod/bank';
import { useFMOD } from './FMODProvider';
import Slider from './Slider';

const PlayQueue: React.FC = () => {

    const [ paused, setPaused ] = useState(true);
    const [ playQueue, setPlayQueue ] = usePlayQueue();
    
    const fmod = useFMOD();

    useEffect(() => {
        updatePauseState(true);
    }, [paused]);

    useEffect(() => {
        updatePlayQueueLoading();
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
        playQueue.currentTrack.event.start();
        updatePauseState(false)
    };

    const nextTrack = () => {
        fmod.events.tapeStop.oneShot();
        playQueue.currentTrack.event.stop(0);
        setPlayQueue({
            ...playQueue,
            history: [playQueue.currentTrack, ...playQueue.history], // Add currentTrack to history
            currentTrack: playQueue.nextTracks[0], // Set currentTrack to the next track
            nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
        });
    };

    const prevTrack = () => {
        fmod.events.tapeStop.oneShot();
        playQueue.currentTrack.event.stop(0);
        setPlayQueue({
            ...playQueue,
            history: [playQueue.currentTrack, ...playQueue.history], // Add currentTrack to history
            currentTrack: playQueue.nextTracks[0], // Set currentTrack to the next track
            nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
        });
    };

    const handlePause = () => {
        fmod.events.tapeStop.oneShot();
        setPaused(!paused);
    };

    return (
        <>
            <button>prev</button>
            <button onClick={handlePause}>play/pause</button>
            <button onClick={nextTrack}>next</button>
            <Slider update={() => {}} />
            <div>
                <p>Now playing...</p>
                <p>{playQueue.currentTrack.displayName}</p>
            </div>
            <br />
            {
                playQueue.nextTracks.map((track, index) => (
                    <p key={index}>{ track.displayName }</p>
                ))
            }
        </>
    );
};

export default PlayQueue;
