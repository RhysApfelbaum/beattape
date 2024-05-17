import React from 'react';
import Slider from './components/Slider';
import { useFMOD } from './FMODProvider';
import { Track } from './fmod/track';
import PlayQueueProvider from './PlayQueueProvider';
import PlayQueue from './PlayQueue';


const App: React.FC = () => {
    const fmod = useFMOD();

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    const t = new Track('lazy', 'l a z y', {
        grit: 0,
        brightness: 0,
        chops: 0,
        vocals: 0
    });
    t.fetch();

    fmod.events.vinyl.setParameter('VinylAmount', 0.3, true);
    fmod.events.vinyl.start();

    const loadTrack = async () => {
        await t.load();
        t.event.start();
    };

    const updateVinyl = (value: number) => {
        fmod.events.vinyl.setParameter('VinylAmount', value, false);
    };

    return (
        <PlayQueueProvider>
            <PlayQueue />
            <br />
            <br />
            <br />
            <Slider update={updateVinyl}/>
        </PlayQueueProvider>
    );
};

export default App;
