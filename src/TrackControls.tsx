import React, { useEffect, useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import { useFMOD } from './FMODProvider';
import { FMOD } from './fmod/system';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faBackwardFast, faEllipsis, faFastForward, faPause } from '@fortawesome/free-solid-svg-icons';
import { Pointer } from './fmod/pointer';
import { StreamedSound } from './fmod/sound';
import { gesture } from './fmod/gesture';

import contributors from './contributors.json';

import styles from './styles/Button.module.css';
import { theme } from './styles/theme';
import CreditLink from './CreditLink';
import Button from './Button';
import TapeReel from './TapeReel';

const mix = (amount: number) => `${(1 - (amount - 1) * (amount - 1)) * 100}%`;

const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

let beatPulseID: number;

const TrackControls: React.FC = () => {

    const [paused, setPaused] = useState(true);
    const [playQueue, setPlayQueue] = usePlayQueue();
    const [amountPoll, setAmountPoll] = useState<Timer | null>(null);
    const [currentTrack, setCurrentTrack] = useState(playQueue.currentTrack);
    const [currentTrackLoaded, setCurrentTrackLoaded] = useState(false);

    const fmod = useFMOD();


    useEffect(() => {
        if (!fmod.ready) return;
        loadPCM();
    }, [fmod]);

    const loadPCM = async () => {
        await gesture;
        const channel = new Pointer<any>();
        const channelGroup = new Pointer<any>();
        FMOD.Result = playQueue.currentTrack.event.instance.getChannelGroup(channelGroup);
        const sound = new StreamedSound('https://play.streamafrica.net/radiojazz', 0, 10,
            () => {
                console.log('pausing');
                channel.deref().setPaused(true);
            },
            () => {
                console.log('unpausing');
                channel.deref().setPaused(false);
            }
        );
        sound.fetch();
        // await sound.source.fetchStatus.promise;
        sound.load();
        // setTimeout(() => {
        //     console.log('playing');
            FMOD.Result = FMOD.Core.playSound(sound.handle, channelGroup.deref(), null, channel);
        // }, 5000);
    };
    // const trackCallback = (type: number, _event: any, parameters: any) => {
    //     if (currentTrack.event.playbackState === 'stopped') {
    //         setPlayQueue({
    //             ...playQueue,
    //             history: [currentTrack, ...playQueue.history],
    //             currentTrack: playQueue.nextTracks[0],
    //             nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
    //         });
    //     } else {
    //         beatPulse();
    //     }
    //     return FMOD.OK;
    // };

    useEffect(() => {
        updatePauseState(true);
    }, [paused]);

    useEffect(() => {
        if (playQueue.currentTrack !== currentTrack) {
            setCurrentTrack(playQueue.currentTrack);
        }
    }, [playQueue]);

    useEffect(() => {
        updatePlayQueueLoading();

        if (amountPoll) {
            clearInterval(amountPoll);
        }

        // Poll the effectiveness of each slider and update the CSS variables.
        const interval = setInterval(() => {
            if (!currentTrack.event.isLoaded) return;
            const grit = currentTrack.event.getParameter('GritAmount');
            const brightness = currentTrack.event.getParameter('BrightnessAmount');
            const chops = currentTrack.event.getParameter('ChopsAmount');
            const vocals = currentTrack.event.getParameter('VocalsAmount');

            if (fmod.ref?.current) {
                const style = fmod.ref.current.style;
                style.setProperty('--grit', mix(grit));
                style.setProperty('--brightness', mix(brightness));
                style.setProperty('--chops', mix(chops));
                style.setProperty('--vocals', mix(vocals));
            }
        }, 100);

        setAmountPoll(interval);
    }, [currentTrack]);

    const updatePauseState = (tapestop: boolean) => {
        if (paused) {
            if (!tapestop) {
                currentTrack.event.setPaused(true);
                return;
            }
            fmod.events.paused.start();

            // Tape stop effect jankery
            // This is awful. It polls intensity parameter in the FMOD snapshot every 50ms until it's 0.
            const intervalID = setInterval(() => {
                const intensity = fmod.events.paused.getParameter('Intensity');
                if (intensity >= 100) {
                    currentTrack.event.setPaused(true);
                    clearInterval(intervalID);
                }
            }, 50);
        } else {
            currentTrack.event.setPaused(false);
            if (tapestop) fmod.events.paused.stop(0);
        }
    };

    const updatePlayQueueLoading = async () => {

        const { status: currentTrackStatus, error: currentTrackError } = currentTrack.bank.getStatus();
        const { status: nextTrackStatus } = playQueue.nextTracks[0].bank.getStatus();

        if (currentTrackStatus === 'unloaded') {
            currentTrack.fetch();
        }

        // if (nextTrackStatus === 'unloaded') {
        //     playQueue.nextTracks[0].fetch();
        // }

        for (let i = 1; i < playQueue.nextTracks.length; i++) {
            if (playQueue.nextTracks[i].bank.getStatus().status === 'loaded') {
                playQueue.nextTracks[i].unload();
            }
        }

        switch (currentTrackStatus) {
            case 'unloaded':
                if (currentTrackLoaded) setCurrentTrackLoaded(false);
            case 'fetched':
                await currentTrack.load()
                setCurrentTrackLoaded(true);
                currentTrack.event.start();
                currentTrack.event.setCallback(
                    FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT |
                    FMOD.STUDIO_EVENT_CALLBACK_STOPPED |
                    FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND,
                    (type, _event, parameters) => {
                        if (currentTrack.event.playbackState === 'stopped') {
                            setPlayQueue({
                                ...playQueue,
                                history: [currentTrack, ...playQueue.history],
                                currentTrack: playQueue.nextTracks[0],
                                nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
                            });
                        }

                        if (type === FMOD.STUDIO_EVENT_CALLBACK_TIMELINE_BEAT) {
                            beatPulse();
                            // const time = parameters.position / 1000;
                            //
                            //
                            // console.log(time, currentTrack.sounds.bufferLength());
                        }

                        if (type === FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND) {
                            const sound = currentTrack.sounds.getSound(parameters.name);
                            if (!sound.isLoaded) {
                                // if (currentTrack.event.playbackState !== 'stopped') {
                                //     currentTrack.event.setPaused(true);
                                // }
                                sound.load();
                                // return;
                            }

                            console.log('found sound', sound);

                            // sound.seek(0);

                            parameters.sound = sound.handle;
                            parameters.subsoundIndex = -1;
                            // updatePauseState(false);
                        }


                        return FMOD.OK;
                    }
                );
                currentTrack.event.setParameter('Grit', playQueue.sliderState.grit, false);
                currentTrack.event.setParameter('Brightness', playQueue.sliderState.brightness, false);
                currentTrack.event.setParameter('Chops', playQueue.sliderState.chops, false);
                currentTrack.event.setParameter('Vocals', playQueue.sliderState.vocals, false);
                break;
            case 'error':
                console.error(`Error loading ${currentTrack.name}: ${currentTrackError}`);
                break;
            case 'loaded':
                break;
        }
        updatePauseState(false)
    };

    const nextTrack = () => {
        fmod.events.tapeStop.oneShot();
        currentTrack.event.stop(0);
        setPlayQueue({
            ...playQueue,
            history: [currentTrack, ...playQueue.history],
            currentTrack: playQueue.nextTracks[0],
            nextTracks: [...playQueue.nextTracks.slice(1), playQueue.nextTracks[0]]
        });
    };

    const prevTrack = () => {
        fmod.events.tapeStop.oneShot();
        currentTrack.event.stop(0);

        if (playQueue.history.length === 0) {
            currentTrack.event.start();
            return;
        }

        setPlayQueue({
            ...playQueue,
            nextTracks: playQueue.history.length > 0
                ? [currentTrack, ...playQueue.nextTracks]
                : playQueue.nextTracks,
            currentTrack: playQueue.history[0],
            history: playQueue.history.slice(1)
        });
    };

    const handlePause = () => {
        fmod.events.tapeStop.oneShot();
        if (currentTrackLoaded) setPaused(!paused);
    };

    const beatPulseInterpolate = (start: number, end: number, duration: number) => new Promise<void>(resolve => {
        const startTime = performance.now();

        const callUpdate = (currentTime: number): void => {
            const elapsed = currentTime - startTime;
            const progress = easeInOutQuad(Math.min(elapsed / duration, 1));
            const value = (start + (end - start) * progress) + '%';
            fmod.ref?.current?.style.setProperty('--beat-pulse', value);
            if (progress < 1) {
                beatPulseID = requestAnimationFrame(callUpdate);
            } else {
                resolve();
            }
        };
        beatPulseID = requestAnimationFrame(callUpdate);
    });

    const beatPulse = async () => {
        await beatPulseInterpolate(0, 100, 200);
        await beatPulseInterpolate(100, 0, 600);
    };

    const musicInfo = contributors.soundtomb;

    return (
        <div className='flex flex-col place-content-center items-center bg-base01 py-5 px-5 md:mb-5 w-full md:w-auto md:rounded'>
            <div className='flex flex-col'>
                <p className='text-xl text-base05'>
                    { playQueue.currentTrack.displayName }
                </p>
                <CreditLink contributor={contributors.soundtomb} />
            </div>
            <div className='m-5 flex flex-row items-center gap-3'>
                <TapeReel spinning={!paused} className='w-10 h-10'/>
                <Button onClick={prevTrack}>
                    <FontAwesomeIcon
                        icon={faBackwardFast}
                        color={theme.base03}
                        className='m-5'
                        size='xl'
                    />
                </Button>
                <Button onClick={handlePause}>
                    <FontAwesomeIcon
                        icon={paused ? faPlay : faPause}
                        className='mx-8 my-5'
                        color='color-mix(in srgb, var(--color-base03), var(--color-base09) var(--beat-pulse))'
                        size='xl'
                    />
                </Button>
                <Button onClick={nextTrack}>
                    <FontAwesomeIcon icon={faFastForward}
                        className='m-5'
                        color={theme.base03}
                        size='xl'
                    />
                </Button>
                <TapeReel spinning={!paused} className='w-10 h-10'/>
            </div>
        </div>
    );
};

export default TrackControls;
