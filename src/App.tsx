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

const App: React.FC = () => {
    const fmod = useFMOD();


    const [ awaitingGesture, setAwaitingGesture ] = useState(true);

    setTheme(themes.catppuccinMocha);

    gesture.then(() => setAwaitingGesture(false));

    const pageReady = fmod.ready && !awaitingGesture;

    const updateRadioPosition: PositionUpdater = position => {
        const pan = -2 * position.x / window.innerWidth;
        const distance = .5 + (-position.y / window.innerHeight);
        fmod.events.radio.setParameter('RadioPan', pan, false);
        fmod.events.radio.setParameter('RadioNearness', distance, false);
    };

    const radioShowing = true;

    // App is unable to load if FMOD isn't loade
    const mainPage = (
        <PlayQueueProvider>
            <main className='flex flex-col items-center mx-2 mt-2 md:mx-40'>
                <Art />
                <SliderSwiper />
                { radioShowing &&
                    <Drag onPositionUpdate={updateRadioPosition}>
                        <div style={{
                            alignSelf: 'end',
                            transform: 'translateY(calc(-0.2 * var(--beat-pulse)))'
                        }}>
                            <FontAwesomeIcon icon={faRadio} color={'grey'} size='xl'/>
                        </div>
                    </Drag>

                }
            </main>
            <footer className='fixed bottom-0 w-full flex flex-col justify-center items-center'>
                {/* <PlayQueue /> */}
                <TrackControls />
            </footer>
        </PlayQueueProvider>
    );

    return (
        <AnimatePresence mode="wait">
            { pageReady ? mainPage : <LoadingPage key="loading"/> }
        </AnimatePresence>
    );
};

export default App;
