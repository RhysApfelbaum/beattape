import React, { useEffect, useState } from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider, { usePlayQueue } from './PlayQueueProvider';
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
import { StreamedSound } from './fmod/sound';

import './index.css';
import Palette from './Palette';
import { setTheme, theme, themes } from './styles/theme';
import { main } from 'bun';
import TapeReel from './TapeReel';


const TrackControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: 20px;
    justify-content: center;
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

const App: React.FC = () => {
    const fmod = useFMOD();

    const [showingArt, setShowingArt] = useState(false);
    const [artIndex, setArtIndex] = useState(Math.floor(Math.random() * (Object.keys(artData).length - 2)));

    const art = artData[artIndex];

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return (
        <p>loading...</p>
    );

    setTheme(themes.catppuccinMocha);

    // const test = new EventInstance('event:/Tracks/banktest');
    // test.init();
    // test.load();
    // test.setCallback(
    //     FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND,
    //     (type: number, _event: any, parameters: any)  => {
    //         if (type === FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND) {
    //             if (!piano.file.fetchStatus.isResolved) {
    //                 // TODO: Stop playback here, as the buffer has run out
    //                 console.error('still fetching sound');
    //                 return FMOD.OK;
    //             }
    //             piano.load();
    //             parameters.sound = piano.handle;
    //             parameters.subsoundIndex = -1;
    //         } else if (type === FMOD.STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND) {
    //             FMOD.Result = parameters.sound.release();
    //         }
    //
    //         return FMOD.OK;
    //     }
    // );
    // test.start();


    return (
        <PlayQueueProvider>
            <main className='flex flex-col items-center mx-2 mt-2 md:mx-40'>
                <img src={art.url} className='w-80 md:w-auto rounded border-3 border-[color-mix(in_srgb,var(--color-base03),var(--color-base09)_var(--beat-pulse))]'/>
                {/* <Palette position='top'/> */}
            </main>
            <footer className='fixed bottom-0 w-full flex flex-col justify-center items-center'>
                <PlayQueue />
                <section className='w-full'>
                    <TrackControls />
                </section>
            </footer>
        </PlayQueueProvider>
    );
};

export default App;
