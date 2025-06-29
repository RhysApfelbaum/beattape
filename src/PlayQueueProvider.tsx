import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Track } from './fmod/track';
import tracklistData from './tempTracklist.json';
import { SliderState } from './fmod/sliderState';

const tracklist: Track[] = [];

for (const obj of tracklistData) {
    tracklist.push(new Track(obj.name, obj.displayName, {
        grit: obj.grit,
        brightness: obj.brightness,
        chops: obj.chops,
        vocals: obj.vocals
    }))
};


const currentTrack = tracklist[Math.floor(Math.random() * tracklist.length)];

interface PlayQueue {
    sliderState: SliderState;
    nextTracks: Track[];
    currentTrack: Track;
    history: Track[];
    tracklist: Track[];
}

const trackDistance = (playQueue: PlayQueue, track: Track): number => {
    let result = 0;

    // The current track should always be at the end of the playQueue, so it gets the biggest track distance.
    if (track == playQueue.currentTrack) {
        return 1000;
    }

    // The mean difference between the current slider state and the track slider data...
    result += Math.abs(playQueue.sliderState.grit - track.averageSliderState.grit);
    result += Math.abs(playQueue.sliderState.brightness - track.averageSliderState.brightness);
    result += Math.abs(playQueue.sliderState.chops - track.averageSliderState.chops);
    result += Math.abs(playQueue.sliderState.vocals - track.averageSliderState.vocals);
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
    if (ordinal < playQueue.history.length) result+= 2;
    return result;
};

export const getNextTracks = (playQueue: PlayQueue) => {
    playQueue.tracklist.sort(
        (a, b) => trackDistance(playQueue, a) - trackDistance(playQueue, b)
    );

    const nextTracks: Track[] = [];
    playQueue.tracklist.forEach(track => {
        // if (track == playQueue.currentTrack) return;
        if (nextTracks.length >= playQueue.tracklist.length) return;
        nextTracks.push(track);
    });
    return nextTracks;
};

const PlayQueueContext = createContext<[
    PlayQueue,
    React.Dispatch<React.SetStateAction<PlayQueue>>
] | null>(null);

const playQueue: PlayQueue = {
    sliderState: {
        grit: 0.5,
        brightness: 0.5,
        chops: 0.5,
        vocals: 0.5
    },
    history: [],
    currentTrack: currentTrack,
    nextTracks: [],
    tracklist: tracklist
};

playQueue.nextTracks = getNextTracks(playQueue);

// Create a provider component to wrap the top-level of your application
export const PlayQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playQueueState = useState<PlayQueue>(playQueue);
    return (
        <PlayQueueContext.Provider value={playQueueState}>
            {children}
        </PlayQueueContext.Provider>
    );
};

export const usePlayQueue = () => useContext(PlayQueueContext)!;
export default PlayQueueProvider;
