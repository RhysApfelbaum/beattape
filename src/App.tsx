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
import { EventInstance } from './fmod/event';
import { FMOD } from './fmod/system';
import { Pointer } from './fmod/pointer';

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

const getWav = async () => {
    const response = await fetch('/piano_sample.wav')
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}

let wavData: Uint8Array;

// getWav().then(data => { wavData = data; });

const programmerSoundCallback = async (type: number, _event: any, parameters: any) => {
    if (type === FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND) {
        if (!wavData) return FMOD.OK;
        console.log(parameters);
        const canRead = true;
        const canWrite = false;
        const canOwn = false;
        FMOD.FS_createDataFile('/', 'piano_sample.wav', wavData, canRead, canWrite, canOwn);

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        console.log(info);

        info.length = wavData.byteLength;
        info.numchannels = 2;
        info.defaultfrequency = 48000;
        info.decodebuffersize = 48000;
        info.format = FMOD.SOUND_FORMAT_PCM16;
        info.suggestedsoundtype = FMOD.SOUND_TYPE_WAV;
        const mode = FMOD.LOOP_NORMAL | FMOD.CREATESAMPLE;

        FMOD.Result = FMOD.Core.createSound('/piano_sample.wav', mode, info, sound);
        console.log('sound', sound.deref());
        parameters.sound = sound.deref();
        parameters.subsoundIndex = -1;
        // FMOD.Core.playSound(parameters.sound, null, null, {})
    } else if (type === FMOD.STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND) {
        parameters.sound.release();
    }

    return FMOD.OK;
};

const App: React.FC = () => {
    const fmod = useFMOD();

    const [ showingArt, setShowingArt ] = useState(false);
    const [ artIndex, setArtIndex ] = useState(Math.floor(Math.random() * (Object.keys(artData).length - 2)));

    const art = artData[artIndex];

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return (
        <p>loading...</p>
    );

    // const test = new EventInstance('event:/Tracks/banktest');
    // test.init();
    // test.load();
    // test.setCallback(
    //     FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND,
    //     (type: number, event: any, parameters: any)  => {
    //         programmerSoundCallback(type, event, parameters);
    //         return FMOD.OK as number;
    //     }
    // );
    // test.start();


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
