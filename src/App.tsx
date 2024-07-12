import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider from './PlayQueueProvider';
import TrackControls from './TrackControls';
import TrackSliders from './TrackSliders';
import AmbienceSliders from './AmbienceSliders';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import Effects from './Effects';
import PlayQueue from './PlayQueue';
import Credits from './Credits';
import CreditBox from './CreditBox';
import artData from './art.json';
import ArtPicker from './ArtPicker';

const TrackControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: center;
`;

const Art = styled.img`
    width: 440px;
    height: auto;
    outline: 1px solid ${props => props.theme.colors.warmTint};
    filter: drop-shadow(
        2px 4px 6px 
        color-mix(
            in srgb,
            ${props => props.theme.colors.dark},
            ${props => props.theme.colors.warmLight}
            var(--beat-pulse)
        )
    );
`;

const OpenCredits = styled.button`
    appearance: none;
    background-color: transparent;
    border: none;
    position: absolute;
    left: 1%;
    top: 1%;
    color: ${props => props.theme.colors.brightLight};

    &:hover {
        color: ${props => props.theme.colors.warmLight};
    }
`;

const GlobalStyles = createGlobalStyle`
    body {
        font-family: "DM Mono", monospace;
        font-weight: 400;
        font-size: 15px;
        font-style: normal;
        text-align: center;
        color: white;
        background-color: ${props => props.theme.colors.background};
    }
`;

const App: React.FC = () => {
    const fmod = useFMOD();

    const [ showingCredits, setShowingCredits ] = useState(false);
    const [ art, setArt ] = useState(artData[0]);

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    return (
        <ThemeProvider theme={{ colors: art.theme }}><PlayQueueProvider>
            <GlobalStyles />
            <div style={{
                display: 'grid',
                gridTemplateColumns: '30% 40% 30%'
            }}>
                <div>

                    <ArtPicker />
                </div>
                <Art src={art.url} style={{ justifySelf: 'center' }}/>
                <div>
                    <CreditBox artist={art.artist}/>
                </div>
            </div>
            <TrackControlContainer>
                <TrackSliders />
                <div style={{ width: 200 }}>
                    <TrackControls />
                    <PlayQueue />
                </div>
                <AmbienceSliders />
                <Effects />
            </TrackControlContainer>
            <Credits showing={showingCredits} handleClose={() => {setShowingCredits(false)}}/>
        </PlayQueueProvider></ThemeProvider>
    );
};

export default App;
