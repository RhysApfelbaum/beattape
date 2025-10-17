import React, { createContext, useContext, ReactNode, useState, useReducer, useEffect } from 'react';
import { Track } from './fmod/track';
import tracklistData from './testTracklist.json';
import { SliderState } from './fmod/sliderState';
import { useFMOD } from './FMODProvider';
import { FMOD } from './fmod/system';
import { beatPulse } from './beatPulse';
import { EventInstance } from './fmod/event';

const tracklist: Track[] = [];

for (const obj of tracklistData) {
    tracklist.push(
        new Track(obj.name, obj.displayName, {
            grit: obj.grit,
            brightness: obj.brightness,
            chops: obj.chops,
            vocals: obj.vocals,
        }),
    );
}


const firstTrack = tracklist[Math.floor(Math.random() * tracklist.length)];

const playQueue = {
    sliderState: {
        grit: 0.5,
        brightness: 0.5,
        chops: 0.5,
        vocals: 0.5,
    },
    history: [] as Track[],
    currentTrack: firstTrack,
    nextTracks: [] as Track[],
    changedTracks: [] as Track[],
    tracklist: tracklist,
    loading: true,
    paused: true,
};

type PlayQueue = typeof playQueue;

const trackDistance = (playQueue: PlayQueue, track: Track): number => {
    let result = 0;

    // The current track should always be at the end of the playQueue, so it gets the biggest track distance.
    if (track == playQueue.currentTrack) {
        return 1000;
    }

    // The mean difference between the current slider state and the track slider data...
    result += Math.abs(
        playQueue.sliderState.grit - track.averageSliderState.grit,
    );
    result += Math.abs(
        playQueue.sliderState.brightness - track.averageSliderState.brightness,
    );
    result += Math.abs(
        playQueue.sliderState.chops - track.averageSliderState.chops,
    );
    result += Math.abs(
        playQueue.sliderState.vocals - track.averageSliderState.vocals,
    );
    result /= 4;

    // ...with bias against tracks that have been recently played.
    result += recentScore(playQueue, track) / 2;
    return result;
};

const recentScore = (playQueue: PlayQueue, track: Track): number => {
    if (playQueue.history.length == 0) return 0;
    let ordinal = playQueue.history.length;
    for (let i = 0; i < playQueue.history.length; i++) {
        if (playQueue.history[i] == track) {
            ordinal = i;
            break;
        }
    }
    let result = 1.0 - ordinal / playQueue.tracklist.length;
    if (ordinal < playQueue.history.length) result += 2;
    return result;
};

export const getNextTracks = (playQueue: PlayQueue) => {
    playQueue.tracklist.sort(
        (a, b) => trackDistance(playQueue, a) - trackDistance(playQueue, b),
    );

    const nextTracks: Track[] = [];
    playQueue.tracklist.forEach((track) => {
        // if (track == playQueue.currentTrack) return;
        if (nextTracks.length >= playQueue.tracklist.length) return;
        nextTracks.push(track);
    });
    return nextTracks;
};

const PlayQueueContext = createContext<
    [PlayQueue, React.Dispatch<PlayQueueAction>] | null
>(null);


playQueue.nextTracks = getNextTracks(playQueue);

type PlayQueueAction =
| { type: 'TOGGLE_PAUSE', pauseEvent: EventInstance }
| { type: 'NEXT_TRACK' }
| { type: 'PREVIOUS_TRACK' }
| { type: 'SET_NEXT_TRACKS', nextTracks: Track[] }
| { type: 'SET_SLIDER_STATE', sliderState: SliderState }
| { type: 'UPDATE' }
| { type: 'SET_LOADING'; value: boolean};


function playQueueDispatch(state: PlayQueue, action: PlayQueueAction): PlayQueue {
    console.log(action);
    switch (action.type) {
        case 'UPDATE': {
            const changedTracks: Track[] = [];
            const newNextTracks = getNextTracks(state);
            for (let i = 0; i < newNextTracks.length; i++) {
                if (newNextTracks[i] !== state.nextTracks[i]) {
                    changedTracks.push(newNextTracks[i]);
                }
            }
            return {
                ...state,
                nextTracks: newNextTracks,
                changedTracks: changedTracks
            };
        }
        case 'SET_SLIDER_STATE': {
            return {
                ...state,
                sliderState: action.sliderState
            };
        }
        case 'SET_NEXT_TRACKS': {
            // updatePlayQueueLoading(playQueue);
            return {
                ...state,
                nextTracks: action.nextTracks
            };
        }
        case 'TOGGLE_PAUSE': {
            if (!state.currentTrack.isLoaded) {
                return state;
            }

            return {
                ...state,
                paused: !state.paused
            };
        }
        case 'NEXT_TRACK': {
            return {
                ...state,
                history: [state.currentTrack, ...state.history],
                currentTrack: state.nextTracks[0],
                nextTracks: [
                    ...state.nextTracks.slice(1),
                    state.nextTracks[0],
                ],
            };
        }
        case 'PREVIOUS_TRACK': {
            // if (playQueue.history.length === 0) {
            //     currentTrack.event.start();
            //     return state;
            // }

            return {
                ...state,
                nextTracks: [state.currentTrack, ...state.nextTracks],
                currentTrack: state.history[0],
                history: state.history.slice(1),
            };
        }
        case 'SET_LOADING': {
            return {
                ...state,
                loading: action.value
            }
        }
    }
}

// const updatePlayQueueLoading = (playQueue: PlayQueue) => {
//     if (!playQueue.currentTrack.isLoaded) {
//         loadTrack(playQueue.currentTrack, playQueue)
//     }
// }


// Create a provider component to wrap the top-level of your application
export const PlayQueueProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [state, dispatch] = useReducer(playQueueDispatch, playQueue);
    const fmod = useFMOD();

    const setLoading = (loading: boolean) => {
        dispatch({ type: 'SET_LOADING', value: loading });
    };

    const startTrack = async (track: Track) => {
        await track.load();
        setLoading(false);

        track.event.setPaused(state.paused);
        track.event.setCallback(
            FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT |
                FMOD.STUDIO_EVENT_CALLBACK_STOPPED |
                FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND,
            (type, _event, parameters) => {
                if (type & FMOD.STUDIO_EVENT_CALLBACK_STOPPED) {
                    if (track.isLoaded) {
                        dispatch({ type: 'NEXT_TRACK' });
                    }
                }

                if (type & FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT) {
                    beatPulse();
                    track.sounds.load(
                        parameters.position / 1000,
                    );
                }

                if (type & FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND) {
                    const sound = track.sounds.getSound(
                        parameters.name,
                    );
                    console.log('found sound', sound.url);

                    if (!sound.isLoaded) {
                        console.log(typeof sound.handle);
                        console.log(sound.handle);
                        throw new Error(`Sound not loaded: ${sound.url}`)
                    }

                    sound.stop = () => {
                        if (!track.event.getPaused()) {
                            track.event.setPaused(true);
                            setLoading(true);
                        }
                    };
                    sound.restart = () => {
                        if (track.event.getPaused()) {
                            console.debug('restarting after underflow');
                            track.event.setPaused(false);
                            setLoading(false);
                        }
                    };
                    parameters.sound = sound.handle;
                    parameters.subsoundIndex = -1;
                }

                return FMOD.OK;
            },
        );

        track.event.start();
    };

    console.log(state);

    useEffect(() => {
        for (const track of state.tracklist) {
            if (track.name === state.currentTrack.name) {
                continue;
            }
            if (track.isLoaded) {
                console.log('stopping and unloading', track.displayName);
                track.event.stop(0);
                track.unload();
            }
        }

        if (!state.currentTrack.isLoaded) {
            startTrack(state.currentTrack);
        }
    }, [state.currentTrack]);

    useEffect(() => {
        if (!state.currentTrack.isLoaded)
            return;
        if (!state.currentTrack.event.getPaused()) {
            fmod.events.paused.start();

            // HACK
            // This is awful. It polls intensity parameter in the FMOD snapshot every 50ms until it's 0.
            const intervalID = setInterval(_ => {
                const intensity = fmod.events.paused.getParameter('Intensity');
                if (intensity >= 100) {
                    if (state.currentTrack.isLoaded) {
                        state.currentTrack.event.setPaused(true);
                    }
                    clearInterval(intervalID);
                }
            }, 50);
        } else {
            state.currentTrack.event.setPaused(false);
            fmod.events.paused.stop(0);
        }
    }, [state.paused])

    useEffect(() => {
        // TODO
    }, [state.sliderState])

    return (
        <PlayQueueContext.Provider value={[state, dispatch]}>
            {children}
        </PlayQueueContext.Provider>
    );
};

export const usePlayQueue = () => {
    const ctx = useContext(PlayQueueContext)!;
    if (!ctx) throw new Error('usePlayQueue must be used inside PlayQueueProvider');
    return ctx;
};
export default PlayQueueProvider;
