import React, { useEffect, useRef, useState } from 'react';
import { getNextTracks, usePlayQueue } from './PlayQueueProvider';
import { Track } from './fmod/track';
import { SliderState } from './fmod/sliderState';
import contributors from './contributors.json';
import CreditLink from './CreditLink';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion, useAnimationControls } from 'framer-motion';
import {
    faArrowDown,
    faArrowUp,
    faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './ThemeProvider';
import { dbg } from './fmod/helpers';

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
    const [playQueue, dispatch] = usePlayQueue();
    const [collapsed, setCollapsed] = useState(true);

    type TrackItem = { track: Track; changed: boolean };
    const [trackItems, setTrackItems] = useState<TrackItem[]>([]);

    const bounceControls = useAnimationControls();
    const { theme } = useTheme();

    const bounceArrow = async (repeat = Infinity) => {
        bounceControls.start({
            color: theme.palette.base0A,
        });
        await bounceControls.start({
            y: [0, -10, 0],
            transition: {
                duration: 1,
                ease: 'easeInOut',
                repeat: repeat
            }
        });
        if (repeat < Infinity) {
            bounceControls.start({
                color: theme.palette.base03,
                transition: { duration: 1, ease: 'easeOut' },
            });
        }
    };

    const bounceArrowStop = async () => {
        bounceControls.start({
            y: 0,
            transition: {
                duration: 1,
                ease: 'easeOut'
            } 
        })
        bounceControls.start({
            color: theme.palette.base03,
            transition: { duration: 0.3, ease: 'easeOut' },
        });
    };

    useEffect(() => {
        bounceControls.set({ color: theme.palette.base03 });
    }, [bounceControls, theme.palette.base03]);

    useEffect(() => {
        const nextTrackItems = playQueue.nextTracks.map(track => ({
            track: track,
            changed: false
        }));

        if (trackItems.length === 0) {
            setTrackItems(nextTrackItems);
            return;
        }

        for (let i = 0; i < trackItems.length; i++) {
            nextTrackItems[i].changed = nextTrackItems[i].track !== trackItems[i].track;
        }

        setTrackItems(nextTrackItems);

    }, [playQueue.nextTracks])

    useEffect(() => {
        dbg('changed tracks', playQueue.changedTracks);
        for (const changed of Object.entries(playQueue.changedTracks)) {
            if (changed) {
                bounceArrow(1);
            }
        }
    }, [playQueue.changedTracks]);

    const ref = useRef<HTMLDivElement>(null);

    return (
        <div
            className="
            w-full
            bg-base01
            md:rounded-t-lg
            "
            onMouseEnter={_ => bounceArrow()}
            onMouseLeave={_ => bounceArrowStop()}
        >
            <motion.button
                className="cursor-pointer"
                animate={bounceControls}
                onClick={() => setCollapsed(!collapsed)}
            >
                <FontAwesomeIcon icon={collapsed ? faArrowUp : faArrowDown} />
            </motion.button>
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
                    <tbody className="overflow-scroll">
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
