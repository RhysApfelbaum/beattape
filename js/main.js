
// FMOD global object which must be declared to enable 'main' and 'preRun' and then call
// the constructor function.


// Global 'System' object which has the Studio API functions.
let gSystem;

// Global 'SystemCore' object which has the Core API functions.
let gSystemCore;

let pauseSnapshot = {};
let pauseSnapshotDescription = {};

let playButtonSFX;
let currentTrackIndex;
let rainEvent;
let birdEvent;

let radioSnapshot;
let pitchWobbleSnapshot;
let distortionSnapshot;

let trackInfo;
let playQueue;
let tracklistPromise;

let tapeStopAmount = 0;


// A list of banks to be fetched as soon as possible
const preloadBanks = [];
const mainEvents = []
const FMOD_BUILD_FOLDER = './fmod/build/desktop';

const LOADING_MESSAGE = 'loading...';

const sliderState = {
    changed: false,
    grit: 0.0,
    brightness: 0.0,
    chops: 0.0,
    vocals: 0.0
};

let paused = true;

const FMOD = {
    'preRun': prerun,
    'onRuntimeInitialized': main,
    'INITIAL_MEMORY': 16 * 1024 * 1024
};

FMODModule(FMOD);

function CHECK_RESULT(result) {
    if (result != FMOD.OK) {
        throw new Error (FMOD.ErrorString(result));
    }
}

// Will be called before FMOD runs, but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.  Otherwise load custom data from memory or use own file system.
function prerun() {
    preloadBanks.push(new Bank('Master', `${FMOD_BUILD_FOLDER}/Master.bank`));
    preloadBanks.push(new Bank('Master.strings', `${FMOD_BUILD_FOLDER}/Master.strings.bank`));
    
    preloadBanks.map(bank => bank.fetch());

    tracklistPromise = new Promise(async (resolve, reject) => {
        const tracklist = [];
        let response = await fetch('./tracklist.json');
        let json = await response.json();
        json.forEach(obj => {
            tracklist.push(new Track(obj));
        });
        playQueue = new PlayQueue(tracklist);
        playQueue.currentTrack.fetch();
        resolve(playQueue.currentTrack.fetchPromise);
    });
    
}

// Called when the Emscripten runtime has initialized
async function main() {
    // A temporary empty object to hold our system
    
    let outval = {};
    let result;
    
    
    // Create the system
    result = FMOD.Studio_System_Create(outval);
    CHECK_RESULT(result);
    gSystem = outval.val;
    result = gSystem.getCoreSystem(outval);
    CHECK_RESULT(result);
    gSystemCore = outval.val;
    
    // Optional.  Setting DSP Buffer size can affect latency and stability.
    // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
    result = gSystemCore.setDSPBufferSize(2048, 2);
    CHECK_RESULT(result);
    
    // Optional.  Set sample rate of mixer to be the same as the OS output rate.
    // This can save CPU time and latency by avoiding the automatic insertion of a resampler at the output stage.
    result = gSystemCore.getDriverInfo(0, null, null, outval, null, null);
    CHECK_RESULT(result);
    result = gSystemCore.setSoftwareFormat(outval.val, FMOD.SPEAKERMODE_DEFAULT, 0)
    CHECK_RESULT(result);
    
    // 1024 virtual channels
    result = gSystem.initialize(32, FMOD.STUDIO_INIT_NORMAL, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);
    
    await init();
    
    // Set the framerate to 50 frames per second, or 20ms.
    window.setInterval(updateApplication, 20);
    
    return FMOD.OK;
}

// Called from main, does some application setup.  In our case we will load some sounds.
async function init() {
    let outval = {};
    
    // Load all fetched banks
    await Promise.all(preloadBanks.map(bank => bank.load()));

    CHECK_RESULT( gSystem.getEvent('snapshot:/Paused', pauseSnapshot));
    CHECK_RESULT( pauseSnapshot.val.createInstance(pauseSnapshot) );
    

    playButtonSFX = new SingleInstanceEvent(gSystem, 'event:/SFX/tapeStop');
    playButtonSFX.load();

    rainEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Rain');
    rainEvent.load();

    vinylEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Vinyl');
    vinylEvent.load();

    birdEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Birds');
    birdEvent.load();
    
    radioSnapshot = new SingleInstanceEvent(gSystem, 'snapshot:/Radio');
    radioSnapshot.load();

    pitchWobbleSnapshot = new SingleInstanceEvent(gSystem, 'snapshot:/PitchWobble');
    pitchWobbleSnapshot.load();

    distortionSnapshot = new SingleInstanceEvent(gSystem, 'snapshot:/Distortion');
    distortionSnapshot.load();
    //firstTrack.fetch();
    

    // Load the tracklist and initalize the play queue
    await tracklistPromise;

    const trackNameElement = document.querySelector('#current-track-name');

    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();

    playQueue.currentTrack.event.instance.start();
    playQueue.currentTrack.event.instance.setPaused(true);
    setPauseState(true);
    playQueue.currentTrack.event.instance.start();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.nextTracks[0].fetch();
}

// Called from main, on an interval that updates at a regular rate (like in a game loop)
function updateApplication() {
    
    // This function may be called before a track has finished loading
    if (!playQueue) return;
    if (!playQueue.currentTrack.isLoaded) return;
    if (!playQueue.currentTrack.event) return;

    // Pause logic
    // const outval = {};
    // CHECK_RESULT( pauseSnapshot.val.getParameterByName('Intensity', {}, outval) );
    // let intensity = outval.val;

    // if (intensity >= 100) {
    //     if (!paused) {
    //         alert(isPaused());
    //         playQueue.currentTrack.event.instance.setPaused(true);
    //         paused = true;
    //     }
        
    //     //paused = true;
    // }

    // Next track logic
    let playbackState = {};
    CHECK_RESULT( playQueue.currentTrack.event.instance.getPlaybackState(playbackState) );
    if (playbackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) nextTrack(false);

    updateSliderState();
    if (sliderState.changed) updateTrackSliders(false);

    updateEffectivenessLights();

    // Update FMOD
    gSystem.update();
}

function pauseTrack() {
    pauseSnapshot.val.start();
    const intervalID = setInterval(() => {
        const outval = {};
        CHECK_RESULT( pauseSnapshot.val.getParameterByName('Intensity', {}, outval) );
        const intensity = outval.val;
        if (intensity >= 100) {
            playQueue.currentTrack.event.instance.setPaused(true);
            clearInterval(intervalID);
        }
    }, 50);
}

function playTrack() {
    playQueue.currentTrack.event.instance.setPaused(false);
    pauseSnapshot.val.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
}

async function nextTrack(buttonfx) {
    if (buttonfx) {
        playButtonSFX.oneShot();
    }
    
    // Stop and unload the current track.
    playQueue.currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    let oldTrack = playQueue.currentTrack;
    
    
    // Next track 
    playQueue.nextTrack();

    const trackNameElement = document.querySelector('#current-track-name');
    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.currentTrack.event.instance.start();
    updateTrackSliders(true);
    //oldTrack.unload();
}

async function lastTrack(buttonfx) {
    if (buttonfx) playButtonSFX.oneShot();

    playQueue.currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    playQueue.currentTrack.unload();

    playQueue.lastTrack();

    const trackNameElement = document.querySelector('#current-track-name');
    trackNameElement.innerHTML = LOADING_MESSAGE;
    trackNameElement.classList.add('loading-message');

    await playQueue.currentTrack.load();
    trackNameElement.innerHTML = playQueue.currentTrack.displayName;
    trackNameElement.classList.remove('loading-message');
    playQueue.currentTrack.event.instance.start();
    updateTrackSliders(true);
}

const trackfx = {
    'radio': false,
    'pitch-wobble': false,
    'distortion': false
};
function toggleTrackFX(type) {
    playButtonSFX.oneShot();
    let toggle, label, snapshot;
    switch (type) {
        case 'radio':
            toggle = document.querySelector('#radio-toggle');
            label = document.querySelector('label[for="radio-toggle"]');
            snapshot = radioSnapshot;
            break;
        case 'pitch-wobble':
            toggle = document.querySelector('#pitch-wobble-toggle');
            label = document.querySelector('label[for="pitch-wobble-toggle"]');
            snapshot = pitchWobbleSnapshot;
            break;
        case 'distortion':
            toggle = document.querySelector('#distortion-toggle');
            label = document.querySelector('label[for="distortion-toggle"]');
            snapshot = distortionSnapshot;
            break;
    }
    if (! trackfx[type]) {
        snapshot.instance.start();
        toggle.children[0].style['background-color'] = 'rgb(211, 40, 40)';
        label.style['color'] = 'white';
    } else {
        snapshot.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
        toggle.children[0].style['background-color'] = 'rgb(48, 48, 48)';
        label.style['color'] = 'rgb(68, 68, 68)';
    }
    trackfx[type] = !trackfx[type];
}

// TODO: This is god-awful
function toggleAmbience(type) {
    let playBackState = {};
    playButtonSFX.oneShot();

    if (type == 'rain') {
        CHECK_RESULT( rainEvent.instance.getPlaybackState(playBackState) );
        if (playBackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) {
            // Turn rain on
            rainEvent.instance.start();
            document.querySelector('#rain-toggle').children[0].style['background-color'] = 'rgb(211, 40, 40)';
            document.querySelector('#rain-amount').parentElement.className = 'lit-slider-container';
            document.querySelector(`label[for="rain-amount"]`).style['color'] = 'white';
        } else {
            // Turn rain off
            rainEvent.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
            document.querySelector('#rain-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
            document.querySelector('#rain-amount').parentElement.className = 'slider-container';
            document.querySelector(`label[for="rain-amount"]`).style['color'] = 'rgb(68, 68, 68)';
        }
        updateRainAmount();
    } else if (type == 'vinyl') {
        CHECK_RESULT( vinylEvent.instance.getPlaybackState(playBackState) );
        if (playBackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) {
            // Turn vinyl on
            vinylEvent.instance.start();
            document.querySelector('#vinyl-toggle').children[0].style['background-color'] = 'rgb(211, 40, 40)';
            document.querySelector('#vinyl-amount').parentElement.className = 'lit-slider-container';
            document.querySelector(`label[for="vinyl-amount"]`).style['color'] = 'white';
        } else {
            // Turn vinyl off
            vinylEvent.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
            document.querySelector('#vinyl-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
            document.querySelector('#vinyl-amount').parentElement.className = 'slider-container';
            document.querySelector(`label[for="vinyl-amount"]`).style['color'] = 'rgb(68, 68, 68)';
        }
        updateVinylAmount();
    } else if (type == 'birds') {
        CHECK_RESULT( birdEvent.instance.getPlaybackState(playBackState) );
        if (playBackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) {
            // Turn vinyl on
            birdEvent.instance.start();
            document.querySelector('#birds-toggle').children[0].style['background-color'] = 'rgb(211, 40, 40)';
            document.querySelector('#bird-amount').parentElement.className = 'lit-slider-container';
            document.querySelector(`label[for="bird-amount"]`).style['color'] = 'white';
        } else {
            // Turn vinyl off
            birdEvent.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
            document.querySelector('#birds-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
            document.querySelector('#bird-amount').parentElement.className = 'slider-container';
            document.querySelector(`label[for="bird-amount"]`).style['color'] = 'rgb(68, 68, 68)';
        }
        updateBirdAmount();
    }
}

function updateEffectivenessLights() {
    let trackColor, glowColor;
    let outval = {};
    let glowId, sliderId, labelFor;
    document.querySelectorAll('.slider-track').forEach((element) => {
        switch(element.id) {
            case 'grit-slider-track':
                glowId = '#grit-container';
                sliderId = '#grit';
                labelFor = 'grit';
                CHECK_RESULT(playQueue.currentTrack.event.instance.getParameterByName('GritAmount', {}, outval));
                break;
            case 'brightness-slider-track':
                    
                glowId = '#brightness-container';
                sliderId = '#brightness';
                labelFor = 'brightness';
                CHECK_RESULT(playQueue.currentTrack.event.instance.getParameterByName('BrightnessAmount', {}, outval));
                break;
            case 'chops-slider-track':
                glowId = '#chops-container';
                sliderId = '#chops';
                labelFor = 'chops';
                CHECK_RESULT(playQueue.currentTrack.event.instance.getParameterByName('ChopsAmount', {}, outval));
                break;
            case 'vocals-slider-track':
                glowId = '#vocals-container';
                sliderId = '#vocals';
                labelFor = 'vocals';
                CHECK_RESULT(playQueue.currentTrack.event.instance.getParameterByName('VocalsAmount', {}, outval));
                break; 
            default:
                return;
        }
        
        // This formula boosts lower values and squashes higher values in the interval [0 ... 1].
        let mix = 1 - (outval.val - 1) * (outval.val - 1);
        
        /*
            This uses CSS's color-mix() function to interpolate betweeen greyed out and full colour with each track.
            The mix between 0 and 1, so it needs to be scaled up.
        */
        element.style['background'] = `color-mix(in srgb, var(--slider-track-grey), var(--slider-track-color) ${mix * 100}%)`;
        document.querySelector(sliderId).style.setProperty('--slider-thumb-background', `color-mix(in srgb, rgb(111, 111, 111), var(--slider-thumb-color) ${mix * 100}%)`);
        document.querySelector(glowId).style['filter'] = `drop-shadow(0 0 10px color-mix(in srgb, rgb(255, 238, 222, 0), rgb(255, 238, 222, 1) ${mix * 100}%))`;
        document.querySelector(`label[for=${labelFor}]`).style['color'] = `color-mix(in srgb, rgb(68, 68, 68), white ${mix * 100}%`;
    });
    
}

function updateSliderState() {
    let grit = document.querySelector('#grit').value / 100;
    let brightness = document.querySelector('#brightness').value / 100;
    let chops = document.querySelector('#chops').value / 100;
    let vocals = document.querySelector('#vocals').value / 100;

    if (
        (grit == sliderState.grit)
        & (brightness == sliderState.brightness)
        & (chops == sliderState.chops)
        & (vocals == sliderState.vocals)
    ) {
        sliderState.changed = false;
    } else {
        sliderState.grit = grit;
        sliderState.brightness = brightness;
        sliderState.chops = chops;
        sliderState.vocals = vocals;
        sliderState.changed = true;
    }
}

function updateTrackSliders(immediate) {
    let grit = document.querySelector('#grit').value / 100;
    let brightness = document.querySelector('#brightness').value / 100;
    let chops = document.querySelector('#chops').value / 100;
    let vocals = document.querySelector('#vocals').value / 100;

    
    playQueue.currentTrack.event.instance.setParameterByName('Grit', grit, immediate);
    playQueue.currentTrack.event.instance.setParameterByName('Brightness', brightness, immediate);
    playQueue.currentTrack.event.instance.setParameterByName('Chops', chops, immediate);
    playQueue.currentTrack.event.instance.setParameterByName('Vocals', vocals, immediate);
}

function updatePlayQueue() {
    playQueue.fillNextTracks();
}

function updateRainAmount() {
    let rainAmount = document.querySelector('#rain-amount').value / 100;
    rainEvent.instance.setParameterByName('RainAmount', rainAmount, false);
    
}

function updateVinylAmount() {
    let vinylAmount = document.querySelector('#vinyl-amount').value / 100;
    vinylEvent.instance.setParameterByName('VinylAmount', vinylAmount, false);
}

function updateBirdAmount() {
    let birdAmount = document.querySelector('#bird-amount').value / 100;
    CHECK_RESULT(birdEvent.instance.setParameterByName('BirdAmount', birdAmount, false));
}

function togglePause() {
    playButtonSFX.oneShot();
    if (paused) {
        playTrack();
    } else {
        pauseTrack();
    }
    paused = !paused;
}