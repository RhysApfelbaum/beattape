import React from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider from './PlayQueueProvider';
import TrackControls from './TrackControls';
import TrackSliders from './TrackSliders';
import AmbienceSliders from './AmbienceSliders';
import styled from 'styled-components';
import Effects from './Effects';
import PlayQueue from './PlayQueue';

const TrackControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: center;
`;

const Art = styled.img`
    width: 440px;
    height: auto;
    outline: 1px solid ${props => props.theme.colors.lightTint};
    filter: drop-shadow(2px 4px 6px color-mix(in srgb, ${props => props.theme.colors.dark}, ${props => props.theme.colors.warmLight} var(--beat-pulse)));
`;

const App: React.FC = () => {
    const fmod = useFMOD();

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    return (
        <PlayQueueProvider>
            <Art src="computer.png" />
            <TrackControlContainer>
                <TrackSliders />
                <div style={{ width: 200 }}>
                    <TrackControls />
                    <PlayQueue />
                </div>
                <AmbienceSliders />
                <Effects />
            </TrackControlContainer>
        </PlayQueueProvider>
    );
};

export default App;
