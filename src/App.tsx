import React, { useState } from 'react';
import { useFMOD } from './FMODProvider';
import PlayQueueProvider, { usePlayQueue } from './PlayQueueProvider';
import TrackControls from './TrackControls';
import { AnimatePresence } from 'framer-motion';
import SliderSwiper from './SliderSwiper';
import Drag, { PositionUpdater } from './Drag';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRadio } from '@fortawesome/free-solid-svg-icons';

import './index.css';
import { setTheme, themes } from './styles/theme';
import LoadingPage from './LoadingPage';
import { gesture } from './fmod/gesture';
import Art from './Art';
import PlayQueue from './PlayQueue';
import Palette from './Palette';

const App: React.FC = () => {
    const fmod = useFMOD();

    const [awaitingGesture, setAwaitingGesture] = useState(true);

    setTheme(themes.catppuccinMocha);

    gesture.then(() => setAwaitingGesture(false));

    const pageReady = fmod.ready && !awaitingGesture;

    const updateRadioPosition: PositionUpdater = (position) => {
        const pan = (-2 * position.x) / window.innerWidth;
        const distance = 0.5 + -position.y / window.innerHeight;
        fmod.events.radio.setParameter('RadioPan', pan, false);
        fmod.events.radio.setParameter('RadioNearness', distance, false);
    };

    const radioShowing = true;

    // App is unable to load if FMOD isn't loade
    const mainPage = (
        <PlayQueueProvider>
            <main className="flex flex-col items-center mx-2 mt-2 md:mx-40">
                <Art />
                <SliderSwiper />
            </main>
            <footer className="fixed bottom-0 md:right-[50vw] md:translate-x-[50%] md:w-fit w-full flex flex-col justify-center items-center z-[60]">
                {/* <PlayQueue /> */}
                <TrackControls />
            </footer>
        </PlayQueueProvider>
    );

    return (
        <AnimatePresence mode="wait">
            {pageReady ? mainPage : <LoadingPage key="loading" />}
        </AnimatePresence>
    );
};

export default App;
