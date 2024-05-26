import React from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider from './PlayQueueProvider';
import TrackControls from './TrackControls';
import TrackSliders from './TrackSliders';
import AmbienceSliders from './AmbienceSliders';
import styled from 'styled-components';
import Effects from './Effects';

const TrackControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: 20px;
`;

const App: React.FC = () => {
    const fmod = useFMOD();

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    return (
        <PlayQueueProvider>
            <img src="computer.png" style={{ width: 440, height: 'auto' }}/>
            <TrackControlContainer>
                <TrackSliders />
                <TrackControls />
                <AmbienceSliders />
                <Effects />
            </TrackControlContainer>
        </PlayQueueProvider>
    );
};

export default App;
