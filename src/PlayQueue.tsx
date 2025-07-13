import React, { useEffect, useRef, useState } from 'react';
import { getNextTracks, usePlayQueue } from './PlayQueueProvider';
import { Track } from './fmod/track';
import { SliderState } from './fmod/sliderState';
import contributors from './contributors.json';
import CreditLink from './CreditLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowDown,
    faArrowUp,
    faArrowUp19,
    faArrows,
    faPlay,
    faUpDown,
} from '@fortawesome/free-solid-svg-icons';

const playIcon = (
    <FontAwesomeIcon
        icon={faPlay}
        className="ml-5"
        size="xs"
        style={{ transform: 'scale(calc(var(--beat-pulse) * 0.3 + 100%))' }}
    />
);

const TrackRow: React.FC<{
    track: Track;
    changed?: boolean;
    current?: boolean;
}> = ({ track, changed = false, current = false }) => {
    let classList = 'py-2';

    if (changed) {
        classList += ' animate-track-changed';
    }

    if (current) {
        classList += ' bg-base02 bold py-10 text-lg';
    }

    return (
        <tr className="">
            <td className={classList}>{current && playIcon}</td>
            <td className={classList}>{track.displayName}</td>
            <td className={classList}>
                <CreditLink contributor={contributors.soundtomb} />
            </td>
        </tr>
    );
};

const PlayQueue: React.FC = () => {
    const [playQueue, setPlayQueue] = usePlayQueue();
    const [collapsed, setCollapsed] = useState(true);

    type TrackItem = { track: Track; changed: boolean };
    const [trackItems, setTrackItems] = useState<TrackItem[]>([]);
    const [sliderState, setSliderState] = useState<SliderState>(
        playQueue.sliderState,
    );

    const ref = useRef<HTMLDivElement>(null);

    const ref = useRef<HTMLDivElement>(null);

    const fillNextTracks = () => {
        const nextTracks = getNextTracks(playQueue);
        const newTrackItems: TrackItem[] = [];
        if (trackItems.length === 0) {
            // If there are no track items to display, it's the first time loading the page.
            nextTracks.map((track) =>
                newTrackItems.push({ track: track, changed: false }),
            );
        } else {
            // Otherwise compare track by track, and mark the different ones as changed
            for (let i = 0; i < nextTracks.length; i++) {
                newTrackItems.push({
                    track: nextTracks[i],
                    changed: nextTracks[i] !== trackItems[i].track,
                });
            }
        }
        setPlayQueue({ ...playQueue, nextTracks: nextTracks });
        setTrackItems(newTrackItems);
    };

    useEffect(() => {
        if (
            playQueue.sliderState.grit === sliderState.grit &&
            playQueue.sliderState.brightness === sliderState.brightness &&
            playQueue.sliderState.chops === sliderState.chops &&
            playQueue.sliderState.vocals === sliderState.vocals
        ) {
            const newTrackItems: TrackItem[] = [];
            playQueue.nextTracks.map((track) => {
                if (newTrackItems.length < playQueue.tracklist.length) {
                    newTrackItems.push({ track: track, changed: false });
                }
            });

            for (let i = 0; i < trackItems.length; i++) {
                if (trackItems[i].track !== playQueue.nextTracks[i]) {
                    setTrackItems(newTrackItems);
                    break;
                }
            }
        } else setSliderState(playQueue.sliderState);
    }, [playQueue]);

    useEffect(fillNextTracks, [sliderState]);

    return (
        <div
            className="
            w-full
            bg-base01
            md:rounded-t-lg
            group
            "
        >
            <button
                className="
                    hover:cursor-pointer
                    border-2
                    border-transparent
                    md:animate-bounce
                    w-full
                    ease-in-out
                    rounded
                    px-10
                    pt-2
                    opacity-100
                    md:opacity-0
                    group-hover:opacity-100
                    transition-all
                    duration-500
                "
                onClick={() => setCollapsed(!collapsed)}
            >
                <FontAwesomeIcon icon={collapsed ? faArrowUp : faArrowDown} />
            </button>
            <div
                className={
                    'overflow-hidden transition-[height] ease-in-out duration-500'
                }
                style={{
                    height: collapsed ? 0 : ref.current?.scrollHeight,
                }}
                ref={ref}
            >
                <table className="w-full table-auto text-left">
                    <thead>
                        <tr>
                            <th className="font-normal py-2 text-base03"></th>
                            <th className="font-normal py-2 text-base03">
                                Track
                            </th>
                            <th className="font-normal py-2 text-base03">
                                Composer
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <TrackRow
                            track={playQueue.currentTrack}
                            changed={false}
                            current
                        />
                        {trackItems
                            .slice(0, trackItems.length - 1)
                            .map((item, index) => (
                                <TrackRow
                                    key={item.track.name + index}
                                    track={item.track}
                                    changed={item.changed}
                                />
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PlayQueue;
