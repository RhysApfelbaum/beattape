import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider from './PlayQueueProvider';
import TrackControls from './TrackControls';
import TrackSliders from './TrackSliders';
import AmbienceSliders from './AmbienceSliders';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import Effects from './Effects';
import PlayQueue from './PlayQueue';
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
    width: auto;
    height: auto;
    max-height: 440px;
    border: 2px solid color-mix(
        in srgb,
        ${props => props.theme.colors.darkTint},
        ${props => props.theme.colors.lightTint}
        var(--beat-pulse)
    );
    border-radius: 5px;
    filter: drop-shadow(
        2px 4px 6px 
        color-mix(
            in srgb,
            transparent,
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

const SelectArtButton = styled.button`
    background: none;
    border: none;
    font: inherit;
    color: ${props => props.theme.colors.brightLight};
    border: 1px solid ${props => props.theme.colors.brightLight};
    border-radius: 5px;
    padding: 10px;
    transition: background 0.3s ease;

    &:hover {
        background-color: ${props => props.theme.colors.brightLight};
        color: ${props => props.theme.colors.darkTint};
        font-weight: bolder;
    }
`;

const GlobalStyles = createGlobalStyle`
    body {
        font-family: "DM Mono", monospace;
        font-weight: 400;
        font-size: 15px;
        font-style: normal;
        text-align: center;
        color: ${props => props.theme.colors.brightLight};
        background-color: ${props => props.theme.colors.background};
    }
`;

const App: React.FC = () => {
    const fmod = useFMOD();

    const [ showingArt, setShowingArt ] = useState(false);
    const [ artIndex, setArtIndex ] = useState(Math.floor(Math.random() * Object.keys(artData).length));

    const art = artData[artIndex];

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return;

    return (
        <ThemeProvider theme={{ colors: art.theme }}><PlayQueueProvider>
            <GlobalStyles />
            <div style={{
                display: 'grid',
                gridTemplateColumns: '30% 40% 30%'
            }}>
                <div style={{
                    justifySelf: 'end',
                    alignSelf: 'end'
                }}>
                    { showingArt ? 
                        <ArtPicker
                            artist={art.artist}
                            setArtIndex={setArtIndex}
                            handleClose={() => {setShowingArt(false)}}
                        />
                        :
                        <SelectArtButton
                            onClick={() => setShowingArt(true)}
                        >
                            <strong>Change Artwork</strong>
                        </SelectArtButton>
                    }

                </div>
                <div style={{ height: 440, alignSelf: 'center', display: 'flex', alignContent: 'end' }}>
                    <Art src={art.url} style={{ margin: 'auto auto 0 auto'}}/>
                </div>
                <div style={{
                    justifySelf: 'start',
                    alignSelf: 'end',
                    width: '100%'
                }}>
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
        </PlayQueueProvider></ThemeProvider>
    );
};

export default App;
