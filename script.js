// Global 'System' object which has the Studio API functions.
var gSystem;

// Global 'SystemCore' object which has the Core API functions.
var gSystemCore;

var pauseSnapshot = {};
var pauseSnapshotDescription = {};

var playButtonSFX;
var currentTrack;
var currentTrackIndex;
var rainEvent;

let trackInfo;
fetch('./tracklist.json')
    .then((response) => response.json())
    .then((json) => {
        trackInfo = json;
 });

let tracklist = [];
let playQueue = [];

function fillPlayQueue() {
    let newPlayQueue = [];

    trackInfo.forEach((info) => {
        document.querySelector('#play-queue').replaceChildren();

    });
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
        this.load();
        this.instance.start();
        this.instance.release();
        this.instance = null;
    }
}

class Track {

    constructor(name) {
        this.name = name;
        this.eventPath = `event:/Tracks/${name}`;
        this.bankURL = `./fmod/build/desktop/${name}.bank`;
        this.bankName = `${name}.bank`
        this.bankPath = `/${this.bankName}`;
        this.event = null;
        this.bankHandle = null;
    }

    // A simple check to see whether the bank and the event have been loaded
    get isLoaded() {
        return (this.event != null) && (this.bankHandle != null);
    }

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
            .then(() => {
                let result = gSystem.loadBankFile(this.bankPath, FMOD.STUDIO_LOAD_BANK_NORMAL, handleOutval);
                if (result != FMOD.OK) {
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

    radioSnapshot = new SingleInstanceEvent(gSystem, 'snapshot:/Radio');
    radioSnapshot.load();
    rainEvent.load();
    vinylEvent.load();

    trackInfo.forEach((item) => {
        console.log(item);
        tracklist.push(new Track(item.name));
    });

    // Load the first track in the paused state
    currentTrackIndex = 0;
    currentTrack = tracklist[currentTrackIndex];
    currentTrack.load().then(() => {
        currentTrack.event.instance.start();
        currentTrack.event.instance.setPaused(true);
        setPauseState(true);
    });
    //setPauseState(true);
    //console.log(currentTrack);
    
    document.querySelector('#current-track-name').innerHTML = currentTrack.name;
}

// Called from main, on an interval that updates at a regular rate (like in a game loop)
function updateApplication() {
    
    // This function may be called before a track has finished loading
    if (currentTrack.isLoaded) {
        
        // Pause logic
        let intensityFinal = {};
        CHECK_RESULT( pauseSnapshot.val.getParameterByName('Intensity', {}, intensityFinal) );
        if ((intensityFinal.val >= 100) && (! isPaused())) {
            currentTrack.event.instance.setPaused(true);
        }


        
        // Next track logic
        let playbackState = {};
        CHECK_RESULT( currentTrack.event.instance.getPlaybackState(playbackState) );
        if (playbackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) nextTrack(false);

        updateTrackSliders();
    }

    // Update FMOD
    gSystem.update();
}

function isPaused() {
    let outval = {};
    let paused;
    let pauseSnapshotPlayback;

    CHECK_RESULT( currentTrack.event.instance.getPaused(outval) );
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
        currentTrack.event.instance.setPaused(false);
        pauseSnapshot.val.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    }
}

function nextTrack(buttonfx) {
    if (buttonfx) playButtonSFX.oneShot();

    currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    currentTrack.unload();
    currentTrackIndex = (currentTrackIndex + 1) % tracklist.length;
    currentTrack = tracklist[currentTrackIndex];
    currentTrack.load().then(() => {
        //updateTrackSliders();
        currentTrack.event.instance.start();
    });


    document.querySelector('#current-track-name').innerHTML = currentTrack.name;

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
        } else {
            // Turn rain off
            rainEvent.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
            document.querySelector('#rain-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
        }
        updateRainAmount();
    } else if (type == 'vinyl') {
        CHECK_RESULT( vinylEvent.instance.getPlaybackState(playBackState) );
        if (playBackState.val == FMOD.STUDIO_PLAYBACK_STOPPED) {
            // Turn vinyl on
            vinylEvent.instance.start();
            document.querySelector('#vinyl-toggle').children[0].style['background-color'] = 'rgb(211, 40, 40)';
        } else {
            // Turn vinyl off
            vinylEvent.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
            document.querySelector('#vinyl-toggle').children[0].style['background-color'] = 'rgb(48, 48, 48)';
        }
        updateVinylAmount();
    } else {

    }
}

function updateTrackSliders() {
    let grit = document.querySelector('#grit').value / 100;
    let synths = document.querySelector('#synths').value / 100;
    let chops = document.querySelector('#chops').value / 100;

    // TODO: Implement this
    let vocals = document.querySelector('#vocals').value / 100;

    currentTrack.event.instance.setParameterByName('Grit', grit, false);
    currentTrack.event.instance.setParameterByName('Brightness', synths, false);
    currentTrack.event.instance.setParameterByName('Chops', chops, false);
    currentTrack.event.instance.setParameterByName('Vocals', vocals, false);
}

function updateRainAmount() {
    let rainAmount = document.querySelector('#rain-amount').value / 100;
    rainEvent.instance.setParameterByName('RainAmount', rainAmount, false);
    
}

function updateVinylAmount() {
    let vinylAmount = document.querySelector('#vinyl-amount').value / 100;
    vinylEvent.instance.setParameterByName('VinylAmount', vinylAmount, false);
    
}
function togglePause() {
    playButtonSFX.oneShot();
    setPauseState(!isPaused());
}