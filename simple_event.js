var FMOD = {};                              // FMOD global object which must be declared to enable 'main' and 'preRun' and then call the constructor function.
FMOD['preRun'] = prerun;                    // Will be called before FMOD runs, but after the Emscripten runtime has initialized
FMOD['onRuntimeInitialized'] = main;        // Called when the Emscripten runtime has initialized
FMOD['INITIAL_MEMORY'] = 64 * 1024 * 1024;  // FMOD Heap defaults to 16mb which is enough for this demo, but set it differently here for demonstration (64mb)
FMODModule(FMOD);                           // Calling the constructor function with our object

var gSystem;                // Global 'System' object which has the Studio API functions.
var gSystemCore;            // Global 'SystemCore' object which has the Core API functions.
var eventDescription = {};  // Global Event Description for the explosion event.  This event is played as a one-shot and released immediately after it has been created.
var eventInstance = {};     // Global Event Instance for the looping ambience event.  A single instance is started or stopped based on user input.


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
        FMOD.FS_createPreloadedFile(folderName, name, fileUrl + name, canRead, canWrite);
    })
}

// Called when the Emscripten runtime has initialized
function main() {
    // A temporary empty object to hold our system
    var outval = {};
    var result;

    console.log("Creating FMOD System object\n");

    // Create the system and check the result
    result = FMOD.Studio_System_Create(outval);
    CHECK_RESULT(result);

    console.log("grabbing system object from temporary and storing it\n");

    // Take out our System object
    gSystem = outval.val;

    result = gSystem.getCoreSystem(outval);
    CHECK_RESULT(result);

    gSystemCore = outval.val;

    // Optional.  Setting DSP Buffer size can affect latency and stability.
    // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
    console.log("set DSP Buffer size.\n");
    result = gSystemCore.setDSPBufferSize(2048, 2);
    CHECK_RESULT(result);

    // Optional.  Set sample rate of mixer to be the same as the OS output rate.
    // This can save CPU time and latency by avoiding the automatic insertion of a resampler at the output stage.
    console.log("Set mixer sample rate");
    result = gSystemCore.getDriverInfo(0, null, null, outval, null, null);
    CHECK_RESULT(result);
    result = gSystemCore.setSoftwareFormat(outval.val, FMOD.SPEAKERMODE_DEFAULT, 0)
    CHECK_RESULT(result);

    console.log("initialize FMOD\n");

    // 1024 virtual channels
    result = gSystem.initialize(1024, FMOD.STUDIO_INIT_NORMAL, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);

    // Starting up your typical JavaScript application loop
    console.log("initialize Application\n");

    initApplication();

    // Set the framerate to 50 frames per second, or 20ms.
    console.log("Start game loop\n");

    window.setInterval(updateApplication, 20);

    return FMOD.OK;
}

// Helper function to load a bank by name.
function loadBank(name) {
    var bankhandle = {};
    CHECK_RESULT( gSystem.loadBankFile("/" + name, FMOD.STUDIO_LOAD_BANK_NORMAL, bankhandle) );
}

// Called from main, does some application setup.  In our case we will load some sounds.
function initApplication()
{
    console.log("Loading events\n");

    loadBank("Master.bank");
    loadBank("Master.strings.bank");

    // Get the Looping Ambience event
    CHECK_RESULT( gSystem.getEvent("event:/Music", eventInstance) );
    CHECK_RESULT( eventInstance.val.createInstance(eventInstance) );

    CHECK_RESULT( eventInstance.val.start() );
    CHECK_RESULT( eventInstance.val.setPaused(true) );

}

// Called from main, on an interval that updates at a regular rate (like in a game loop).
function updateApplication() {
    var result;


    let health = Number(document.getElementById('health-slider').value);
    let intensity = Number(document.getElementById('intensity-slider').value);

    CHECK_RESULT( eventInstance.val.setParameterByName('Intensity', intensity, false) );
    CHECK_RESULT( eventInstance.val.setParameterByName('Health', health, false) );
    // Update FMOD
    result = gSystem.update();
    CHECK_RESULT(result);
}

function togglePause() {
    let paused = {};

    CHECK_RESULT( eventInstance.val.getPaused(paused) );
    console.log(paused);
    CHECK_RESULT( eventInstance.val.setPaused(! paused.val) );

    document.getElementById('toggle-pause').innerHTML = paused.val ? 'Pause' : 'Play';
}