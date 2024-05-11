import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Track } from './fmod/track';
import tracklistData from './tracklist.json';
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


const currentTrack = tracklist.shift()!;

interface PlayQueue {
    sliderState: SliderState;
    nextTracks: Track[];
    currentTrack: Track;
    history: Track[];
}


const PlayQueueContext = createContext<[
    PlayQueue,
    React.Dispatch<React.SetStateAction<PlayQueue>>
] | null>(null);

// Create a provider component to wrap the top-level of your application
export const PlayQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const playQueueState = useState<PlayQueue>({
        sliderState: {
            grit: 0,
            brightness: 0,
            chops: 0,
            vocals: 0
        },
        history: [],
        currentTrack: currentTrack,
        nextTracks: tracklist
    });
    return (
        <PlayQueueContext.Provider value={playQueueState}>
            {children}
        </PlayQueueContext.Provider>
    );
};

export const usePlayQueue = () => useContext(PlayQueueContext)!;
export default PlayQueueProvider;
