import React, { useEffect, useState } from 'react';
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
import { Sound } from './fmod/sound';

import { MPEGDecoderWebWorker } from 'mpg123-decoder';
import { ChunkedQueue } from './fmod/ringBuffer';
const decoder = new MPEGDecoderWebWorker();


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

// const sounds = new Map<string, Sound>();
// sounds.set('/piano_sample.wav', new Sound('/piano_sample.wav', '/piano_sample.wav');
// const piano = new Sound('/piano_sample.wav', '/piano_sample.wav');


const App: React.FC = () => {
    const fmod = useFMOD();

    useEffect(() => {
        if (!fmod.ready) return;
        loadPCM();
    }, [fmod]);

    const loadPCM = async () => {
        await decoder.ready;
        const response = await fetch('https://play.streamafrica.net/radiojazz');

        if (response.body === null) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();


        // const leftBuffer = new ChunkedQueue(441000);
        // const rightBuffer = new ChunkedQueue(441000);

        let sampleRate = 44100;
        // let samplesDecoded = 0;

        // const pusher = async () => {
        //     while (true) {
        //         const { done, value } = await reader.read();
        //         if (done) break;
        //         const { channelData } = await decoder.decode(value);
        //         const [ left, right ] = channelData;
        //         // console.log(sampleRate, samplesDecoded);
        //         // leftBuffer.feed(left);
        //         // rightBuffer.feed(right);
        //         await Promise.all([ leftBuffer.add(left), rightBuffer.add(right) ]);
        //         // break;
        //     }
        // }

        // pusher();

        // if (done) return;

        // const {channelData, samplesDecoded, sampleRate} = await decoder.decode(value);
        //

        const sound = new Pointer<any>();
        const info = FMOD.CREATESOUNDEXINFO();
        info.defaultfrequency = sampleRate;
        info.decodebuffersize = 44100;
        info.numchannels = 2;
        info.length = info.defaultfrequency * info.numchannels * 2 * 5;
        info.format = FMOD.SOUND_FORMAT_PCM16;
        info.pcmsetposcallback = (
            sound: any,
            subsound: any,
            position: any,
            postype: any
        ) => {
            alert('hi');
            console.log('pcmcallback', sound, subsound, position, postype);
            return FMOD.OK;
        };
        const mode = FMOD.OPENUSER | FMOD.LOOP_NORMAL;

        // console.log('channel data', channelData);
        // info.pcmreadcallback = (sound: any, data: any, datalen: number) => {
        //     console.log('datalen', datalen);
        //     console.log('sound', sound);
        //     const openstate = new Pointer<any>();
        //     const percentbuffered = new Pointer<any>();
        //     const starving = new Pointer<any>();
        //     const diskbusy = new Pointer<any>();
        //
        //     const leftRead = leftBuffer.retrieve(datalen);
        //     const rightRead = rightBuffer.retrieve(datalen);
        //
        //
        //     const nullRead = leftRead === null || rightRead === null;
        //
        //     if (nullRead) {
        //         console.log('nullread');
        //         for (let i = 0; i < (datalen >> 2); i++) {
        //             FMOD.setValue(data + (i << 2) + 0, 0, 'i16');    // left channel
        //             FMOD.setValue(data + (i << 2) + 2, 0, 'i16');    // right channel
        //         }
        //     } else {
        //         console.log('nonnullread');
        //         for (let i = 0; i < (datalen >> 2); i++) {
        //             FMOD.setValue(data + (i << 2) + 0, leftRead[i], 'i16');    // left channel
        //             FMOD.setValue(data + (i << 2) + 2, rightRead[i], 'i16');    // right channel
        //         }
        //     }
        //
        //     sound.getOpenState(openstate, percentbuffered, starving, diskbusy);
        //     console.log(openstate, percentbuffered, starving, diskbusy);
        //
        //     return FMOD.OK;
        // };

        // info.pcmsetposcallback = (sound: any, subsound: any, position: any, postype: any) => FMOD.OK;
        const ptr1 = new Pointer<any>();
        const ptr2 = new Pointer<any>();
        const len1 = new Pointer<any>();
        const len2 = new Pointer<any>();
        FMOD.Result = FMOD.Core.createSound('', mode, info, sound);
        FMOD.Result = sound.deref().lock(0, info.length, ptr1, ptr2, len1, len2);
        let offset = 0;
        while (offset < len1.deref()) {
            const { done, value } = await reader.read();
            if (done) break;
            const { channelData, samplesDecoded, errors } = await decoder.decode(value);
            console.log(samplesDecoded, offset, len1.deref());

            const [left, right] = channelData;
            for (let i = offset; i < (samplesDecoded >> 2); i++) {
                const leftIndex = ptr1.deref() + i << 2;
                const rightIndex = leftIndex + 2;
                FMOD.setValue(leftIndex, left[i], 'i16');    // left channel
                FMOD.setValue(rightIndex, right[i], 'i16');    // right channel
            }
            offset += samplesDecoded;
            // break;
        }
        const openstate = new Pointer<any>();
        const percentbuffered = new Pointer<any>();
        const starving = new Pointer<any>();
        const diskbusy = new Pointer<any>();
        sound.deref().getOpenState(openstate, percentbuffered, starving, diskbusy);
        console.log(openstate, percentbuffered, starving, diskbusy);
        FMOD.Result = FMOD.Core.playSound(sound.deref(), null, null, {});
        sound.deref().unlock(ptr1.deref(), ptr2.deref(), len1.deref(), len2.deref());
        setInterval(() => {
            sound.deref().getOpenState(openstate, percentbuffered, starving, diskbusy);
            console.log(openstate, percentbuffered, starving, diskbusy);
        }, 2000);

    };


    const [showingArt, setShowingArt] = useState(false);
    const [artIndex, setArtIndex] = useState(Math.floor(Math.random() * (Object.keys(artData).length - 2)));

    const art = artData[artIndex];
    // piano.fetch().then(() => {
    //     console.log(piano);
    // });

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) return (
        <p>loading...</p>
    );


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
                    {showingArt ?
                        <ArtPicker
                            artist={art.artist}
                            setArtIndex={setArtIndex}
                            handleClose={() => { setShowingArt(false) }}
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
                    <Art src={art.url} style={{ margin: 'auto auto 0 auto' }} />
                </div>
                <div style={{
                    justifySelf: 'start',
                    alignSelf: 'end',
                    width: '100%'
                }}>
                    <CreditBox artist={art.artist} />
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
