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

let trackInfo;
let playQueue;
let tracklistPromise;

const sliderState = {
    changed: false,
    grit: 0.0,
    brightness: 0.0,
    chops: 0.0,
    vocals: 0.0
};

class Track {

    constructor(trackData) {
        this.name = trackData.name;
        this.displayName = trackData.displayName;
        this.eventPath = `event:/Tracks/${this.name}`;
        this.bankURL = `./fmod/build/desktop/${this.name}.bank`;
        this.bankName = `${this.name}.bank`
        this.bankPath = `/${this.bankName}`;
        this.event = null;
        this.bankHandle = null;
        this.sliderData = {
            grit: trackData.grit,
            brightness: trackData.brightness,
            chops: trackData.chops,
            vocals: trackData.vocals 
        };
        this.changed = false;
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return (this.event != null) && (this.bankHandle != null);
    }

    // Does not require the FMOD system to be initialized.
    async fetchBankFile() {
        let canRead = true;
        let canWrite = false;
        let canOwn = false;

        
        let response = await fetch(this.bankURL)
        let buffer = await response.arrayBuffer();
        FMOD.FS_createDataFile('/', this.bankName, new Uint8Array(buffer), canRead, canWrite, canOwn);

    };

    async loadBankFile() {
        let outval = {};
        let handle, loadingState;

        gSystem.loadBankFile(this.bankPath, FMOD.STUDIO_LOAD_BANK_NONBLOCKING, outval);
        handle = outval.val;

        handle.getLoadingState(outval);
        loadingState = outval.val;
        console.log(loadingState == FMOD.STUDIO_LOADING_STATE_LOADED);
    }

    // Load a remote bank file containing the track event, and then load that event.
    async load() {
        let canRead = true;
        let canWrite = false;
        let canOwn = false;
        let handleOutval = {};

        return new Promise((resolve, reject) => {
            fetch(this.bankURL)
            .then(response => response.arrayBuffer())
            .then(buffer => new Uint8Array(buffer))
            .then(array => FMOD.FS_createDataFile('/', this.bankName, array, canRead, canWrite, canOwn))
            .then(() => gSystem.loadBankFile(this.bankPath, FMOD.STUDIO_LOAD_BANK_NORMAL, handleOutval))
            .then(fmodResult => {
                if (fmodResult != FMOD.OK) {
                    throw new Error(`Error loading bank from downloaded file: ${FMOD.ErrorString(result)}`);
                };
            })
            .then(() => {
                this.bankHandle = handleOutval.val;
                this.event = new SingleInstanceEvent(gSystem, this.eventPath);
                
                this.event.load();
                resolve(FMOD.OK);
            })
            .catch(e => {
                console.error(`Error loading ${this.name} from ${this.bankURL}\n${e.message}\n`)
                reject();
            });
        });
        
    }

    unload() {
        // Unload the track event if it's loaded
        if (this.event.isLoaded) {
            this.event.unload();
            this.event = null;
        }

        // Unload the bank
        this.bankHandle.unload();
        this.bankHandle = null;

        // Unlink the bank file, which should destroy it, because it should be the only reference to it.
        FMOD.FS_unlink(this.bankPath);

        return FMOD.OK;
    }
}

class SingleInstanceEvent {
    description = null;
    instance = null;
    constructor(system, path) {
        let outval = {};
        CHECK_RESULT( system.getEvent(path, outval) );
        this.description = outval.val;
        return FMOD.OK;
    }

    get isLoaded() {
        return this.instance != null;
    }

    load() {
        let outval = {};

        // Create an event instance from our event description
        CHECK_RESULT( this.description.createInstance(outval) );

        // Point the instance property to our newly created event instance
        this.instance = outval.val;

        return FMOD.OK
    }

    unload() {
        // Mark the event instance for destruction
        CHECK_RESULT( this.instance.release() );

        // Point instance to null
        this.instance = null;
        return FMOD.OK;
    }

    // Loads the event, plays it once, and immediately unloads it
    oneShot() {
        //this.load();
        console.log('hi')
        this.instance.start();
        //this.instance.release();
        //this.instance = null;
    }
}

class PlayQueue {

    constructor(tracklist) {
        this.tracklist = tracklist;
        this.currentTrack = this.tracklist[0];
        this.nextTracks = [];
        this.history = [];
        this.playedTracks = new Set();

        this.fillNextTracks();
    }

    // WARNING: THIS SUCKS
    // It's horrible and I'm just trying to make it work
    trackDistance(track) {

        let result = 0;
        if (track == this.currentTrack) return 1000;
        let grit = document.querySelector('#grit').value / 100;
        let brightness = document.querySelector('#brightness').value / 100;
        let chops = document.querySelector('#chops').value / 100;
        let vocals = document.querySelector('#vocals').value / 100;
        let gritDist = Math.abs(grit - track.sliderData.grit);
        let brightnessDist = Math.abs(brightness - track.sliderData.brightness);
        let chopsDist = Math.abs(chops - track.sliderData.chops);
        let vocalsDist = Math.abs(vocals - track.sliderData.vocals);
        result = (gritDist + brightnessDist + chopsDist + vocalsDist) / 4;
        result += this.recentScore(track) / 2;
        return result;
    }

    recentScore(track) {
        if (this.history.length == 0) return 0;
        let ordinal = this.history.length;
        for (let i = 0; i < this.history.length; i++) {
            if (this.history[i] == track) {
                ordinal = i;
                break;
            }
        }
        let result = 1.0 - ordinal / this.tracklist.length;
        if (ordinal < this.history.length) result+= 2;
        return result;
    }

    fillNextTracks() {
        let oldNext = this.nextTracks;
        this.tracklist.sort(
            (a, b) => this.trackDistance(a) - this.trackDistance(b)
        );
        
        this.nextTracks = [];
        this.tracklist.forEach(track => {
            if (track == this.currentTrack) return;
            if (this.nextTracks.length >= this.tracklist.length) return;
            this.nextTracks.push(track);
        });
        
        // If oldNext is an empty array, the webpage has just loaded, so all tracks are considered not changed
        if (oldNext.length == 0) {
            this.updateDisplay();
            return;
        }

        for (let i = 0; i < this.nextTracks.length; i++) {
            if (this.nextTracks[i] != oldNext[i])
                this.nextTracks[i].changed = true;
            else
                this.nextTracks[i].changed = false;
        }
        this.updateDisplay();
    }

    nextTrack() {
        this.playedTracks.add(this.currentTrack);

        // The track history begins the most recently played track
        this.history.unshift(this.currentTrack);

        this.nextTracks.push(this.currentTrack);
        this.currentTrack = this.nextTracks.shift();
        this.updateDisplay();
    }

    lastTrack() {
        if (this.history.length == 0) return;
        this.nextTracks.pop();
        this.nextTracks.unshift(this.currentTrack);
        
        this.currentTrack = this.history.shift();
        this.updateDisplay();
    }

    updateDisplay() {
        let unorderedListElement = document.querySelector('#play-queue');
        unorderedListElement.replaceChildren();
        this.nextTracks.forEach(track => {
            //console.log(track);
            let li = document.createElement('li');
            li.innerText = track.displayName;
            
            if (track.changed) {
                li.className = 'track-label-changed';
                track.changed = false;
            }
            else li.className = 'track-label';
            unorderedListElement.appendChild(li);
        });
        document.querySelector('#current-track-name').innerHTML = this.currentTrack.displayName;
    }
}

// FMOD global object which must be declared to enable 'main' and 'preRun' and then call
// the constructor function.
var FMOD = {
    'preRun': prerun,
    'onRuntimeInitialized': main,
    'INITIAL_MEMORY': 16 * 1024 * 1024
};

FMODModule(FMOD);

// Simple error checking function for all FMOD return values.
function CHECK_RESULT(result) {
    if (result != FMOD.OK) {
        throw new Error (FMOD.ErrorString(result));
    }
}

// Will be called before FMOD runs, but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.  Otherwise load custom data from memory or use own file system.
function prerun() {
    let fileParent = "./fmod/build/desktop/";    
    let fileNames;
    let folderName = "/";
    let canRead = true;
    let canWrite = false;
    
    fileNames = ['Master.bank', 'Master.strings.bank'];
    
    fileNames.forEach((name) => {
        FMOD.FS_createPreloadedFile(folderName, name, fileParent + name, canRead, canWrite);
    });

    tracklistPromise = fetch('./tracklist.json')
    .then(response => response.json())
    .then(json => {
        let tracklist = [];
        json.forEach(obj => {
            tracklist.push(new Track(obj));
        });
        playQueue = new PlayQueue(tracklist);
    });
    
}

// Called when the Emscripten runtime has initialized
function main() {
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
    
    init();
    
    // Set the framerate to 50 frames per second, or 20ms.
    window.setInterval(updateApplication, 20);
    
    return FMOD.OK;
}

// Called from main, does some application setup.  In our case we will load some sounds.
function init() {
    let outval = {};
    
    // Load Master bank from preloaded file
    CHECK_RESULT( gSystem.loadBankFile('/Master.bank', FMOD.STUDIO_LOAD_BANK_NORMAL, outval) );
    CHECK_RESULT( gSystem.loadBankFile('/Master.strings.bank', FMOD.STUDIO_LOAD_BANK_NORMAL, outval) );


    CHECK_RESULT( gSystem.getEvent('snapshot:/Paused', pauseSnapshot));
    CHECK_RESULT( pauseSnapshot.val.createInstance(pauseSnapshot) );
    

    playButtonSFX = new SingleInstanceEvent(gSystem, 'event:/SFX/tapeStop');
    rainEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Rain');
    vinylEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Vinyl');
    birdEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Birds');
    
    
    radioSnapshot = new SingleInstanceEvent(gSystem, 'snapshot:/Radio');
    playButtonSFX.load();
    radioSnapshot.load();
    rainEvent.load();
    vinylEvent.load();
    birdEvent.load();
    playButtonSFX.load();

    // Load the tracklist and initalize the play queue
    tracklistPromise
        .then(() => playQueue.currentTrack.load())
        .then(() => {
            playQueue.currentTrack.event.instance.start();
            playQueue.currentTrack.event.instance.setPaused(true);
            setPauseState(true);
            document.querySelector('#current-track-name').innerHTML = playQueue.currentTrack.displayName;playQueue.currentTrack.event.instance.start();
        });
}

// Called from main, on an interval that updates at a regular rate (like in a game loop)
function updateApplication() {
    
    // This function may be called before a track has finished loading
    if (!playQueue) return;
    if (!playQueue.currentTrack.isLoaded) return;
    
        
    // Pause logic
    let intensityFinal = {};
    CHECK_RESULT( pauseSnapshot.val.getParameterByName('Intensity', {}, intensityFinal) );
    if ((intensityFinal.val >= 100) && (! isPaused())) {
        playQueue.currentTrack.event.instance.setPaused(true);
    }
    
    // Next track logic
    let playbackState = {};
    CHECK_RESULT( playQueue.currentTrack.event.instance.getPlaybackState(playbackState) );
    if (playbackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) nextTrack(false);

    updateSliderState();
    if (sliderState.changed) updateTrackSliders();

    updateEffectivenessLights();

    // Update FMOD
    gSystem.update();
}

function isPaused() {
    let outval = {};
    let paused;
    let pauseSnapshotPlayback;

    CHECK_RESULT( playQueue.currentTrack.event.instance.getPaused(outval) );
    paused = outval.val;
    CHECK_RESULT( pauseSnapshot.val.getPlaybackState(outval) );
    pauseSnapshotPlayback = outval.val;
    if (paused) return true;
    return pauseSnapshotPlayback != FMOD.STUDIO_PLAYBACK_STOPPED;
}

function setPauseState(state) {
    if (state) {
        CHECK_RESULT( pauseSnapshot.val.start() );
    } else {
        // Play the track
        playQueue.currentTrack.event.instance.setPaused(false);
        pauseSnapshot.val.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    }
}

function nextTrack(buttonfx) {
    if (buttonfx) {
        playButtonSFX.oneShot();
    }
    
    // Stop and unload the current track.
    playQueue.currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    let oldTrack = playQueue.currentTrack;
    
    
    // Next track 
    playQueue.nextTrack();
    playQueue.currentTrack = playQueue.currentTrack;
    playQueue.currentTrack.load().then(() => {
        playQueue.currentTrack.event.instance.start();
        oldTrack.unload();
        updateTrackSliders();
    });
}

function lastTrack(buttonfx) {
    if (buttonfx) playButtonSFX.oneShot();

    playQueue.currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    playQueue.currentTrack.unload();

    playQueue.lastTrack();

    playQueue.currentTrack.load().then(() => {
        playQueue.currentTrack.event.instance.start();
        updateTrackSliders();
        document.querySelector('#current-track-name').innerHTML = playQueue.currentTrack.displayName;
    });
}

let trackfx = true;
function toggleTrackFX(type) {
    playButtonSFX.oneShot();
    if (type != 'radio') return;
    if (trackfx) {
        radioSnapshot.instance.start();
        document.querySelector('#radio-toggle').children[0].style['background-color'] = 'rgb(211, 40, 40)';
    } else {
        radioSnapshot.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
        document.querySelector('#radio-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
    }
    trackfx = !trackfx;

}

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

        element.style['background'] = `color-mix(in srgb, rgb(48, 48, 48), rgb(206, 168, 189) ${mix * 100}%)`;
        document.querySelector(sliderId).style.setProperty('--slider-thumb-background', `color-mix(in srgb, rgb(77, 77, 77), rgb(182, 222, 242) ${mix * 100}%)`);
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
function updateTrackSliders() {
    let grit = document.querySelector('#grit').value / 100;
    let brightness = document.querySelector('#brightness').value / 100;
    let chops = document.querySelector('#chops').value / 100;
    let vocals = document.querySelector('#vocals').value / 100;

    
    playQueue.currentTrack.event.instance.setParameterByName('Grit', grit, false);
    playQueue.currentTrack.event.instance.setParameterByName('Brightness', brightness, false);
    playQueue.currentTrack.event.instance.setParameterByName('Chops', chops, false);
    playQueue.currentTrack.event.instance.setParameterByName('Vocals', vocals, false);
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
    birdEvent.instance.setParameterByName('BirdAmount', birdAmount, false);
}

function togglePause() {
    playButtonSFX.oneShot();
    setPauseState(!isPaused());
}