import React, { useEffect, useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import { useFMOD } from './FMODProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import {
    faBackwardFast,
    faEllipsis,
    faFastForward,
    faPause,
} from '@fortawesome/free-solid-svg-icons';

import contributors from './contributors.json';

import CreditLink from './CreditLink';
import Button from './Button';
import TapeReel from './TapeReel';
import { useTheme } from './ThemeProvider';
import PlayQueue from './PlayQueue';
import { dbg } from './fmod/helpers';

// This is probably the worst part of the entire project. This code is awful.

const TrackControls: React.FC = () => {
    const [playQueue, dispatch] = usePlayQueue();

    const { theme } = useTheme()

    const fmod = useFMOD();

    useEffect(() => {
        if (!fmod.ready) return;
    }, [fmod]);


    const togglePause = () => {
        fmod.events.tapeStop.oneShot();
        dispatch({ type: 'TOGGLE_PAUSE', pauseEvent: fmod.events.paused });
    };

    const nextTrack = () => {
        fmod.events.tapeStop.oneShot();
        dispatch({ type: 'NEXT_TRACK' });
    };

    const prevTrack = () => {
        fmod.events.tapeStop.oneShot();
        dispatch({ type: 'PREVIOUS_TRACK' });
    }

    useEffect(() => dispatch({ type: 'UPDATE' }), []);

    useEffect(() => dbg(playQueue), [playQueue]);

    let playButtonIcon = playQueue.paused ? faPlay : faPause;
    if (playQueue.loading) playButtonIcon = faEllipsis;

    return (
        <div className="flex flex-col place-content-center items-center bg-base01 py-5 px-5 md:mb-5 w-full md:w-auto md:rounded">
            <PlayQueue />
            <div className="flex flex-col">
                <p className="text-xl text-base05">
                    {playQueue.currentTrack.displayName}
                </p>
                <CreditLink contributor={contributors.soundtomb} />
            </div>
            <div className="m-5 flex flex-row items-center gap-3">
                <TapeReel spinning={!playQueue.paused} className="w-10 h-10" />
                <Button onClick={prevTrack}>
                    <FontAwesomeIcon
                        icon={faBackwardFast}
                        color={theme.palette.base03}
                        className="m-3"
                        size="xl"
                    />
                </Button>
                <Button onClick={togglePause} disabled={playQueue.loading}>
                    <FontAwesomeIcon
                        icon={playButtonIcon}
                        className="mx-8 my-3"
                        color="color-mix(in srgb, var(--color-base03), var(--color-base09) var(--beat-pulse))"
                        size="xl"
                    />
                </Button>
                <Button onClick={nextTrack}>
                    <FontAwesomeIcon
                        icon={faFastForward}
                        className="m-3"
                        color={theme.palette.base03}
                        size="xl"
                    />
                </Button>
                <TapeReel spinning={!playQueue.paused} className="w-10 h-10" />
            </div>
        </div>
    );
};

export default TrackControls;
