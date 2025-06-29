import React, { useEffect, useState } from 'react'; import { useFMOD } from './FMODProvider'; import PlayQueueProvider, { usePlayQueue } from './PlayQueueProvider'; import TrackControls from './TrackControls'; import artData from './art.json'; import './index.css'; import Palette from './Palette'; import { setTheme, themes } from './styles/theme'; import LoadingPage from './LoadingPage'; import { gesture } from './fmod/gesture';
import TrackSliders from './TrackSliders';

const App: React.FC = () => {
    const fmod = useFMOD();

    const [showingArt, setShowingArt] = useState(false);
    const [artIndex, setArtIndex] = useState(Math.floor(Math.random() * (Object.keys(artData).length - 2)));

    const [ awaitingGesture, setAwaitingGesture ] = useState(true);

    const art = artData[artIndex];

    gesture.then(() => setAwaitingGesture(false));

    // App is unable to load if FMOD isn't loaded
    if (!fmod.ready) {
        return <LoadingPage message='Loading...' />;
    }

    // A gesture needs to be made on the page before audio can start
    if (awaitingGesture) {
        return <LoadingPage message='Click anywhere to start' />;
    }



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
                <TrackSliders />
            </main>
            <footer className='fixed bottom-0 w-full flex flex-col justify-center items-center'>
                {/* <PlayQueue /> */}
                <TrackControls />
            </footer>
        </PlayQueueProvider>
    );
};

export default App;
