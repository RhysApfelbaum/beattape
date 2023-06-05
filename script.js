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

var tracknames = [
    'aquarium',
    'rough',
    'echo',
    'snooze',
    'lazy'
];

var tracklist = [];

class SingleInstanceEvent {
    description = null;
    instance = null;
    constructor(system, path) {
        let outval = {};
        CHECK_RESULT( system.getEvent(path, outval) );
        this.description = outval.val;
    }

    get isLoaded() {
        return this.instance != null;
    }

    async load() {
        let outval = {};
        CHECK_RESULT( this.description.createInstance(outval) );
        this.instance = outval.val;
    }

    unload() {
        // Mark the event instance for destruction
        this.instance.release();

        // Point instance to null
        this.instance = null;
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
    name;
    displayName;
    event = null;

    constructor(system, name) {
        this.name = name;
        this.event = new SingleInstanceEvent(system, 'event:/Tracks/' + name);
    }
}

// FMOD global object which must be declared to enable 'main' and 'preRun' and then call
// the constructor function.
var FMOD = {
    'preRun': prerun,
    'onRuntimeInitialized': main,
    'INITIAL_MEMORY': 64 * 1024 * 1024
};

FMODModule(FMOD);

// Simple error checking function for all FMOD return values.
function CHECK_RESULT(result) {
    if (result != FMOD.OK) {
        console.error(FMOD.ErrorString(result));
        throw msg;
    }
}

// Will be called before FMOD runs, but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.  Otherwise load custom data from memory or use own file system.
function prerun() {
    var fileUrl = "/fmod/build/desktop/";
    var fileNames;
    var folderName = "/";
    var canRead = true;
    var canWrite = false;
    
    fileNames = [
        "Master.bank",
        "Master.strings.bank",
    ];
    
    fileNames.forEach((name) => {
        if (FMOD.FS_createPreloadedFile(folderName, name, fileUrl + name, canRead, canWrite) != FMOD.OK) {
            console.error('error making preloaded file:' + name);
        }
    })
}

// Called when the Emscripten runtime has initialized
function main() {
    // A temporary empty object to hold our system
    var outval = {};
    var result;
    
    
    // Create the system and check the result
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
    result = gSystem.initialize(1024, FMOD.STUDIO_INIT_NORMAL, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);
    
    initApplication();
    
    // Set the framerate to 50 frames per second, or 20ms.
    window.setInterval(updateApplication, 20);
    
    return FMOD.OK;
}

// Helper function to load a bank by name.
function loadBank(name) {
    var bankhandle = {};
    CHECK_RESULT( gSystem.loadBankFile("/" + name, FMOD.STUDIO_LOAD_BANK_NORMAL, bankhandle) );

}

// Called from main, does some application setup.  In our case we will load some sounds.
function initApplication() {

    loadBank('Master.bank');
    loadBank('Master.strings.bank');

    CHECK_RESULT( gSystem.getEvent('snapshot:/Paused', pauseSnapshot));
    CHECK_RESULT( pauseSnapshot.val.createInstance(pauseSnapshot) );
    

    playButtonSFX = new SingleInstanceEvent(gSystem, 'event:/SFX/tapeStop');
    rainEvent = new SingleInstanceEvent(gSystem, 'event:/Ambiences/Rain');

    rainEvent.load();

    tracknames.forEach((name) => {
        tracklist.push(new Track(gSystem, name));
    });

    // Load the first track in the paused state
    currentTrackIndex = 0;
    currentTrack = tracklist[currentTrackIndex];
    currentTrack.event.load();
    currentTrack.event.instance.start();
    document.querySelector('#current-track-name').innerHTML = currentTrack.name;
    setPauseState(true);
}

// Called from main, on an interval that updates at a regular rate (like in a game loop).
function updateApplication() {
    // Update FMOD
    gSystem.update();

    // Pause logic
    let intensityFinal = {};
    CHECK_RESULT( pauseSnapshot.val.getParameterByName('Intensity', {}, intensityFinal) );
    if ((intensityFinal.val >= 100) && (! isPaused())) {
        currentTrack.event.instance.setPaused(true);
    }
    //currentTrack.event.instance.setParameterByName('Synthesized', document.querySelector('#synthesized').value / 100, false);
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

function nextTrack() {
    playButtonSFX.oneShot();
    currentTrack.event.instance.stop(FMOD.STUDIO_STOP_ALLOWFADEOUT);
    currentTrack.event.unload();
    currentTrackIndex = (currentTrackIndex + 1) % tracklist.length;
    currentTrack = tracklist[currentTrackIndex];
    currentTrack.event.load();

    updateTrackSliders();

    currentTrack.event.instance.start();
    document.querySelector('#current-track-name').innerHTML = currentTrack.name;

}

function toggleAmbience(type) {
    if (type != 'rain') return;

    let playBackState = {};

    playButtonSFX.oneShot();
    updateRainAmount();
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
}

function updateTrackSliders() {
    let grit = document.querySelector('#grit').value / 100;
    let synths = document.querySelector('#synths').value / 100;
    let chops = document.querySelector('#chops').value / 100;
    let vocals = document.querySelector('#vocals').value / 100;

    currentTrack.event.instance.setParameterByName('Sampled', grit, false);
    currentTrack.event.instance.setParameterByName('Synthesized', synths, false);
    currentTrack.event.instance.setParameterByName('Chopped', chops, false);



}

function updateRainAmount() {
    let rainAmount = document.querySelector('#rain-amount').value / 100;
    rainEvent.instance.setParameterByName('RainAmount', rainAmount, false);
    
}

function togglePause() {
    playButtonSFX.oneShot();
    setPauseState(!isPaused());
}