import React, { createContext, useContext, ReactNode, useState } from 'react';
import { Track } from './fmod/track';
import { PlayQueue } from './fmod/playQueue';
import tracklistData from './tracklist.json';

const tracklist: Track[] = [];

tracklistData.forEach((obj: any) => {
    tracklist.push(new Track(obj.name, obj.displayName, {
        grit: obj.grit,
        brightness: obj.brightness,
        chops: obj.chops,
        vocals: obj.vocals
    }))
});

const playQueue = new PlayQueue(tracklist, {
    grit: 0,
    brightness: 0,
    chops: 0,
    vocals: 0
});

const PlayQueueContext = createContext<PlayQueue>(playQueue);

// Create a provider component to wrap the top-level of your application
export const PlayQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ pq, _ ] = useState(playQueue);
    return (
        <PlayQueueContext.Provider value={ pq }>
            {children}
        </PlayQueueContext.Provider>
    );
};

export const usePlayQueue = () => useContext(PlayQueueContext);
