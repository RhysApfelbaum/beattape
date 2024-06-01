import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { FMOD } from './fmod/system';
import { Bank } from './fmod/bank';
import { EventInstance } from './fmod/event';

declare const FMODModule: any;
const preloadBanks: Bank[] = [];


const fmodInitialState = {
    events: {
        paused:      new EventInstance('snapshot:/Paused'),
        pitchWobble: new EventInstance('snapshot:/PitchWobble'),
        radio:       new EventInstance('snapshot:/Radio'),
        distortion:  new EventInstance('snapshot:/Distortion'),
        tapeStop:    new EventInstance('event:/SFX/tapeStop'),
        rain:        new EventInstance('event:/Ambiences/Rain'),
        vinyl:       new EventInstance('event:/Ambiences/Vinyl'),
        birds:       new EventInstance('event:/Ambiences/Birds'),
    },
    ref: null as React.RefObject<HTMLElement> | null,
    ready: false
};

FMOD.preRun = () => {
    preloadBanks.push(new Bank('Master', `./fmod_banks/Master.bank`));
    preloadBanks.push(new Bank('Master.strings', `./fmod_banks/Master.strings.bank`));
    preloadBanks.map(bank => bank.fetch());
};


const mainLoop = () => {
    FMOD.Result = FMOD.Studio.update();
};

const FMODContext = createContext<typeof fmodInitialState>(fmodInitialState);

// Create a provider component to wrap the top-level of your application
export const FMODProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const [ fmod, setFmod ] = useState(fmodInitialState);
    const ref = useRef<HTMLDivElement>(null);

    FMOD.onSystemInitialized = async () => {

        // Load all fetched banks
        await Promise.all<void>(preloadBanks.map((bank: Bank) => bank.load()));

        // Load all global events into memory
        for (const name in fmodInitialState.events) {
            const event = fmodInitialState.events[name as keyof typeof fmodInitialState.events];
            event.init();
            event.load();
        }
        
        // Start FMOD main loop
        window.setInterval(mainLoop, 20);

        // Mark FMOD state as ready
        setFmod(prevFmod => ({ ...prevFmod, ref: ref, ready: true}));
    };

    useEffect(() => {
        FMODModule(FMOD);
    },[]);


    if (ref.current) {
        ref.current.style.setProperty('--thumb-color', '#ff0000');
    }

    return (
        <FMODContext.Provider value={fmod}>
            <div ref={ref}>{children}</div>
        </FMODContext.Provider>
    );
};

export const useFMOD = () => useContext(FMODContext);
