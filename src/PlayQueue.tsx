import React, { useEffect, useState } from 'react';
import { getNextTracks, usePlayQueue } from './PlayQueueProvider';
import { Track } from './fmod/track';
import { SliderState } from './fmod/sliderState';
import contributors from './contributors.json';
import CreditLink from './CreditLink';


const TrackRow: React.FC<{ track: Track, changed?: boolean, current?: boolean }> = ({
    track,
    changed = false,
    current = false
}) => {
    
    let classList = 'py-5';

    if (changed) {
        classList += ' animate-track-changed'
    };

    if (current) {
        classList += ' bg-base01'
    }

    return (
        <tr className='border-y border-solid'>
            <td className={classList}>
                {current && '>'}
            </td>
            <td className={classList}>
                {track.displayName}
            </td>
            <td className={classList}>
                <CreditLink contributor={contributors.soundtomb}/>
            </td>
        </tr>
    )

};

const PlayQueue: React.FC = () => {

    const [ playQueue, setPlayQueue ] = usePlayQueue();

    type TrackItem = { track: Track, changed: boolean };
    const [ trackItems, setTrackItems] = useState<TrackItem[]>([]);
    const [ sliderState, setSliderState ] = useState<SliderState>(playQueue.sliderState);

    const fillNextTracks = () => {
        const nextTracks = getNextTracks(playQueue);
        const newTrackItems: TrackItem[] = [];
        if (trackItems.length === 0) {
            // If there are no track items to display, it's the first time loading the page.
            nextTracks.map(track => newTrackItems.push({ track: track, changed: false }));
        } else {
            // Otherwise compare track by track, and mark the different ones as changed
            for (let i = 0; i < nextTracks.length; i++) {
                newTrackItems.push({
                    track: nextTracks[i],
                    changed: nextTracks[i] !== trackItems[i].track
                });
            }
        }
        setPlayQueue({ ...playQueue, nextTracks: nextTracks });
        setTrackItems(newTrackItems);
    };

    useEffect(() => {
        if (playQueue.sliderState.grit === sliderState.grit
            && playQueue.sliderState.brightness === sliderState.brightness
            && playQueue.sliderState.chops === sliderState.chops
            && playQueue.sliderState.vocals === sliderState.vocals
        ) {
            const newTrackItems: TrackItem[] = [];
            playQueue.nextTracks.map(track => {
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
        <table className='w-full table-auto text-left'>
            <caption>Playqueue</caption>
            <thead>
                <tr>
                    <th></th>
                    <th>Track</th>
                    <th>Composer</th>
                </tr>
            </thead>
            <tbody>
                <TrackRow track={playQueue.currentTrack} changed={false} current/>
                {
                    trackItems.map((item, index) =>
                        <TrackRow
                            key={item.track.name + index}
                            track={item.track}
                            changed={item.changed}
                        />)
                }
            </tbody>
        </table>
    );
};

export default PlayQueue;
