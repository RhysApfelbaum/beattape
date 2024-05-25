import React from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider from './PlayQueueProvider';
import TrackControls from './TrackControls';
import TrackSliders from './TrackSliders';
import AmbienceSliders from './AmbienceSliders';


const App: React.FC = () => {
    const fmod = useFMOD();

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    return (
        <PlayQueueProvider>
            <TrackSliders />
            <TrackControls />
            <AmbienceSliders />
        </PlayQueueProvider>
    );
};

export default App;
