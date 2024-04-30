import { FMOD } from './fmod/system';
import { Bank } from './fmod/bank';
import { SliderState } from './fmod/sliderState';
import { FMODEvent } from './fmod/event'
import { Track } from './fmod/track'
import { Pointer } from './fmod/pointer';
import { PlayQueue } from './fmod/playQueue';
import './css/style.css';
import tracklistData from './tracklist.json';

// AHHHHH
export declare var FMODModule: any;

const preloadBanks: Bank[] = [];
let playQueue: PlayQueue;


const LOADING_MESSAGE = 'loading...';

// Contains events that are constantly available from the master bank
const globalEvents = {
    paused:      new FMODEvent('snapshot:/Paused'),
    pitchWobble: new FMODEvent('snapshot:/PitchWobble'),
    radio:       new FMODEvent('snapshot:/Radio'),
    distortion:  new FMODEvent('snapshot:/Distortion'),
    tapeStop:    new FMODEvent('event:/SFX/tapeStop'),
    rain:        new FMODEvent('event:/Ambiences/Rain'),
    vinyl:       new FMODEvent('event:/Ambiences/Vinyl'),
    birds:       new FMODEvent('event:/Ambiences/Birds'),
};

const sliderState: SliderState = {
    grit: 0.0,
    brightness: 0.0,
    chops: 0.0,
    vocals: 0.0
};

let tracklistPromise: Promise<void>;

let animation: CSSAnimation;
document.getAnimations().forEach((a: CSSAnimation) => {
    if (a.animationName === 'beat') {
        animation = a;
    }
});


FMOD.preRun = () => {
    preloadBanks.push(new Bank('Master', `./fmod_banks/Master.bank`));
    preloadBanks.push(new Bank('Master.strings', `./fmod_banks/Master.strings.bank`));
    preloadBanks.map(bank => bank.fetch());
    tracklistPromise = new Promise(async (resolve) => {
        const tracklist: Track[] = [];
        tracklistData.forEach((obj: any) => {
            console.log(obj);
            tracklist.push(new Track(obj.name, obj.displayName, {
                grit: obj.grit,
                brightness: obj.brightness,
                chops: obj.chops,
                vocals: obj.vocals
            }))
        });
        playQueue = new PlayQueue(tracklist, sliderState);
        playQueue.currentTrack.fetch();
        resolve(playQueue.currentTrack.bank.fetchPromise);
    });
};

FMOD.onSystemInitialized = async () => {

    // Load all fetched banks
    await Promise.all(preloadBanks.map(bank => bank.load()));

    // Load all global events into memory
    Object.values(globalEvents).forEach(event => {
        event.init();
        event.load();
    });

    // Load the tracklist and initialize the play queue
    await tracklistPromise;

    const trackNameElement = document.querySelector('#current-track-name');

    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();

    playQueue.currentTrack.event.start();
    playQueue.currentTrack.event.setPaused(true);
    playQueue.currentTrack.event.start();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.nextTracks[0].fetch();

    const changes = {
        'rain-amount': updateRainAmount,
        'vinyl-amount': updateVinylAmount,
        'bird-amount': updateBirdAmount,
        'grit': () => {
            sliderState.grit = numberInput('grit') / 100;
            updateTrackSliders(false);
            playQueue.fillNextTracks();
        },
        'brightness': () => {
            sliderState.brightness = numberInput('brightness') / 100;
            updateTrackSliders(false);
            playQueue.fillNextTracks();
        },
        'chops': () => {
            sliderState.chops = numberInput('chops') / 100;
            updateTrackSliders(false);
            playQueue.fillNextTracks();
        },
        'vocals':() => {
            sliderState.vocals = numberInput('vocals') / 100;
            updateTrackSliders(false);
            playQueue.fillNextTracks();
        }
    };

    const clicks = {
        'last-track': () => { lastTrack(true); },
        'toggle-pause': togglePause,
        'next-track': () => { nextTrack(true); },
        'rain-toggle': () => { toggleAmbience('rain'); },
        'vinyl-toggle': () => { toggleAmbience('vinyl'); },
        'birds-toggle': () => { toggleAmbience('birds'); },
        'radio-toggle': () => { toggleTrackFX('radio'); },
        'pitch-wobble-toggle': () => { toggleTrackFX('pitchWobble'); },
        'distortion-toggle': () => { toggleTrackFX('distortion'); },
    };

    document.querySelectorAll('.slider').forEach(el => {
        el.addEventListener('change', changes[el.id as keyof typeof changes]);
    });

    document.querySelectorAll('.ambience-toggle, .track-select, #toggle-pause').forEach(el => {
        el.addEventListener('click', clicks[el.id as keyof typeof clicks]);
    })

    window.setInterval(mainLoop, 20);
};

function mainLoop() {
    // Update FMOD
    FMOD.Result = FMOD.Studio.update();
    
    // This function may be called before a track has finished loading
    // There appear to be some issues with this, but they don't seem to cause any important errors so :P
    if (!playQueue) return;
    if (!playQueue.currentTrack.isLoaded) return;
    if (playQueue.currentTrack.event == null) return;
    
    // Go to the next track if the current track has finished
    if (playQueue.currentTrack.event.playbackState === FMOD.STUDIO_PLAYBACK_STOPPED) {
        nextTrack(false);
    }

    // there's an old slider state which is SliderState also
    // const newSliderState: SliderState = {
    //     grit: numberInput('grit') / 100,
    //     brightness: numberInput('brightness') / 100,
    //     chops: numberInput('chops') / 100,
    //     vocals: numberInput('vocals') / 100,
    // };
    //
    //
    // if (Object.keys(sliderState).every((key: keyof SliderState) => newSliderState[key] !== sliderState[key])) {
    //     Object.assign(sliderState, newSliderState);
    //     updateTrackSliders(false);
    // }
    updateEffectivenessLights();
}

FMODModule(FMOD);



let paused = true;



// Will be called before FMOD runs, but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.  Otherwise load custom data from memory or use own file system.
function prerun() {

    
}

// Called when the Emscripten runtime has initialized
async function main() {
    // A temporary empty object to hold our system
    const outval = {};
    let result;
    
    // Set the framerate to 50 frames per second, or 20ms.
    window.setInterval(updateApplication, 20);
}

function pauseTrack() {
    // document.getElementById('toggle-pause').classList.remove('beat-pulse');
    globalEvents.paused.start();

    // Tape stop effect jankery
    const intervalID = setInterval(() => {
        const intensity = globalEvents.paused.getParameter('Intensity');
        if (intensity >= 100) {
            playQueue.currentTrack.event.setPaused(true);
            clearInterval(intervalID);
        }
    }, 50);
}

function playTrack() {
    // document.getElementById('toggle-pause').classList.add('beat-pulse');
    playQueue.currentTrack.event.setPaused(false);
    globalEvents.paused.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
}

async function nextTrack(buttonfx: boolean) {
    if (buttonfx) {
        globalEvents.tapeStop.oneShot();
    }
    
    // Stop and unload the current track.
    playQueue.currentTrack.event.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    const oldTrack = playQueue.currentTrack;
    
    
    // Next track 
    playQueue.nextTrack();

    const trackNameElement = document.querySelector('#current-track-name');
    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.currentTrack.event.start();
    updateTrackSliders(true);
    //oldTrack.unload();
}

async function lastTrack(buttonfx: boolean) {
    if (buttonfx) globalEvents.tapeStop.oneShot();

    playQueue.currentTrack.event.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    playQueue.currentTrack.unload();

    playQueue.lastTrack();

    const trackNameElement = document.querySelector('#current-track-name');
    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.currentTrack.event.start();
    updateTrackSliders(true);
}


const trackfx = {
    radio: false,
    pitchWobble: false,
    distortion: false
};

function toggleTrackFX(type: keyof typeof trackfx) {
    globalEvents.tapeStop.oneShot();

    let toggleId: string;
    let labelSelector: string;

    let snapshot: FMODEvent;
    switch (type) {
        case 'radio':
            toggleId = 'radio-toggle';
            snapshot = globalEvents.radio;
            break;
        case 'pitchWobble':
            toggleId = 'pitch-wobble-toggle';
            snapshot = globalEvents.pitchWobble;
            break;
        case 'distortion':
            toggleId = 'distortion-toggle';
            snapshot = globalEvents.distortion;
            break;
    }

    const toggle = document.getElementById(toggleId) as HTMLButtonElement;
    const toggleLight = toggle.children[0] as HTMLDivElement;
    const label = document.querySelector(`label[for="${toggleId}"]`) as HTMLLabelElement;
    if (! trackfx[type]) {
        snapshot.start();
        toggleLight.style.backgroundColor = 'var(--toggle-light)';
        label.style['color'] = 'white';
    } else {
        snapshot.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
        toggleLight.style.backgroundColor = 'rgb(48, 48, 48)';
        label.style['color'] = 'rgb(68, 68, 68)';
    }
    trackfx[type] = !trackfx[type];
}

function toggleAmbience(ambienceName: string) {
    const lookup = {
        rain: {
            toggleId: 'rain-toggle',
            sliderId: 'rain-amount',
            parameter: 'RainAmount',
            event: globalEvents.rain
        },
        vinyl: {
            toggleId: 'vinyl-toggle',
            sliderId: 'vinyl-amount',
            parameter: 'VinylAmount',
            event: globalEvents.vinyl
        },
        birds: {
            toggleId: 'birds-toggle',
            sliderId: 'bird-amount',
            parameter: 'BirdAmount',
            event: globalEvents.birds
        }
    }
    console.log(ambienceName);
    const data = lookup[ambienceName as keyof typeof lookup];

    globalEvents.tapeStop.oneShot();
    const toggle = document.getElementById(data.toggleId) as HTMLButtonElement;
    const slider = document.getElementById(data.sliderId) as HTMLInputElement;
    const toggleLight = toggle.children[0] as HTMLDivElement;
    const label = document.querySelector(`label[for="${data.sliderId}"]`) as HTMLLabelElement;
    if (data.event.playbackState === FMOD.STUDIO_PLAYBACK_STOPPED) {
        toggleLight.style.backgroundColor = 'var(--toggle-light)';
        slider.parentElement.className = 'lit-slider-container';
        label.style.color = 'white';
        data.event.start();
    } else {
        toggleLight.style.backgroundColor = 'rgb(48, 48, 48)';
        slider.parentElement.className = 'slider-container';
        label.style.color = 'rgb(68, 68, 68)';
        data.event.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    }
    
    // Update ambience amount
    data.event.setParameter(data.parameter, parseInt(slider.value) / 100, false);
}

function updateEffectivenessLights() {
    if (playQueue.currentTrack.event == null) {
        return;
    }
    let trackColor, glowColor;
    let outval = new Pointer<any>();
    let glowId, sliderId, labelFor;
    let parameterAmount: number;
    const parameterNames = ['GritAmount', 'BrightnessAmount', 'ChopsAmount', 'VocalsAmount'];
    document.querySelectorAll('.slider-track').forEach(el => {
        switch(el.id) {
            case 'grit-slider-track':
                glowId = '#grit-container';
                sliderId = '#grit';
                labelFor = 'grit';
                parameterAmount = playQueue.currentTrack.event.getParameter('GritAmount');
                break;
            case 'brightness-slider-track':
                glowId = '#brightness-container';
                sliderId = '#brightness';
                labelFor = 'brightness';
                parameterAmount = playQueue.currentTrack.event.getParameter('BrightnessAmount');
                break;
            case 'chops-slider-track':
                glowId = '#chops-container';
                sliderId = '#chops';
                labelFor = 'chops';
                parameterAmount = playQueue.currentTrack.event.getParameter('ChopsAmount');
                break;
            case 'vocals-slider-track':
                glowId = '#vocals-container';
                sliderId = '#vocals';
                labelFor = 'vocals';
                parameterAmount = playQueue.currentTrack.event.getParameter('VocalsAmount');
                break; 
            default:
                return;
        }

        
        // This formula boosts lower values and squashes higher values in the interval [0 ... 1].
        let mix = 1 - (parameterAmount - 1) * (parameterAmount - 1);
        
        /*
            This uses CSS's color-mix() function to interpolate between greyed out and full colour with each track.
            The mix between 0 and 1, so it needs to be scaled up.
        */

        const sliderTrack = el as HTMLDivElement;
        const glow = document.querySelector(glowId) as HTMLDivElement;
        const slider = document.querySelector(sliderId) as HTMLInputElement;
        const label = document.querySelector(`label[for=${labelFor}]`) as HTMLLabelElement;

        sliderTrack.style.background = `color-mix(in srgb, var(--slider-track-grey), var(--slider-track-color) ${mix * 100}%)`;
        slider.style.setProperty('--slider-thumb-background', `color-mix(in srgb, rgb(111, 111, 111), var(--slider-thumb-color) ${mix * 100}%)`);
        glow.style['filter'] = `drop-shadow(0 0 10px color-mix(in srgb, rgb(255, 238, 222, 0), rgb(255, 238, 222, 1) ${mix * 100}%)`;
        label.style['color'] = `color-mix(in srgb, rgb(68, 68, 68), white ${mix * 100}%`;
    });
}

// Get the value of a number input
function numberInput(id: string): number {
    const input = document.getElementById(id) as HTMLInputElement;
    return parseInt(input.value);
}

function updateTrackSliders(immediate: boolean) {
    playQueue.currentTrack.event.setParameter('Grit', sliderState.grit, immediate);
    playQueue.currentTrack.event.setParameter('Brightness', sliderState.brightness, immediate);
    playQueue.currentTrack.event.setParameter('Chops', sliderState.chops, immediate);
    playQueue.currentTrack.event.setParameter('Vocals', sliderState.vocals, immediate);
}


function updateRainAmount() {
    const input = document.getElementById('rain-amount') as HTMLInputElement;
    globalEvents.rain.setParameter(
        'RainAmount',
        parseInt(input.value) / 100,
        false
    );
}

function updateVinylAmount() {
    const input = document.getElementById('vinyl-amount') as HTMLInputElement;
    globalEvents.vinyl.setParameter(
        'VinylAmount',
        parseInt(input.value) / 100,
        false
    );
}

function updateBirdAmount() {
    const input = document.getElementById('bird-amount') as HTMLInputElement;
    globalEvents.birds.setParameter(
        'BirdAmount',
        parseInt(input.value) / 100,
        false
    );
}

function togglePause() {
    globalEvents.tapeStop.oneShot();
    if (paused) {
        playTrack();
    } else {
        pauseTrack();
    }
    paused = !paused;
}
