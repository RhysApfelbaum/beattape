import React, { useEffect, useState } from 'react';
import { usePlayQueue } from './PlayQueueProvider';
import { Track } from './fmod/track';
import { SliderState } from './fmod/sliderState';
import styled, { keyframes } from 'styled-components';
import theme from './theme';

const TrackChangedAnimation = keyframes`
    from {
        color: ${theme.colors.lightTint};
    } to {
        color: white;
    }
`;

        // color: ${props => props.theme.colors.brightTint};
const ChangedItem = styled.li`
    animation: ${TrackChangedAnimation} 1s;
`;

const ItemList = styled.ul`
    list-style-type: none;
    border-radius: 5px;
    padding: 5px 5px 5px 5px;
    outline: 1px solid #ca8baf;
`;

const PlayQueue: React.FC = () => {

    const [ playQueue, setPlayQueue ] = usePlayQueue();

    type TrackItem = { track: Track, changed: boolean };
    const [ trackItems, setTrackItems] = useState<TrackItem[]>([]);
    const [ sliderState, setSliderState ] = useState<SliderState>(playQueue.sliderState);


    const trackDistance = (track: Track): number => {
        let result = 0;

        // The current track should always be at the end of the playQueue, so it gets the biggest track distance.
        if (track == playQueue.currentTrack) {
            return 1000;
        }

        // The mean difference between the current slider state and the track slider data...
        result += Math.abs(playQueue.sliderState.grit - track.averageSliderState.grit);
        result += Math.abs(playQueue.sliderState.brightness - track.averageSliderState.brightness);
        result += Math.abs(playQueue.sliderState.chops - track.averageSliderState.chops);
        result += Math.abs(playQueue.sliderState.vocals - track.averageSliderState.vocals);
        result /= 4;

        // ...with bias against tracks that have been recently played.
        result += recentScore(track) / 2;
        return result;
    };
    
    const recentScore = (track: Track): number => {
        if (playQueue.history.length == 0) return 0;
        let ordinal = playQueue.history.length;
        for (let i = 0; i < playQueue.history.length; i++) {
            if (playQueue.history[i] == track) {
                ordinal = i;
                break;
            }
        }
        let result = 1.0 - ordinal / playQueue.tracklist.length;
        if (ordinal < playQueue.history.length) result+= 2;
        return result;
    };
    
    const fillNextTracks = () => {
        playQueue.tracklist.sort(
            (a, b) => trackDistance(a) - trackDistance(b)
        );
        
        const nextTracks: Track[] = [];
        playQueue.tracklist.forEach(track => {
            // if (track == playQueue.currentTrack) return;
            if (nextTracks.length >= playQueue.tracklist.length) return;
            nextTracks.push(track);
        });

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
        <div>
            <p>up next:</p>
            <ItemList>
                {
                    trackItems.map((item, index) => item.changed ?
                        <ChangedItem
                            key={item.track.name + index}
                            style={{ textAlign: 'left' }}
                        >
                            {item.track.displayName}
                        </ChangedItem> :
                        <li
                            key={item.track.name + index}
                            style={{ textAlign: 'left' }}
                        >
                            {item.track.displayName}
                        </li>
                    )
                }
            </ItemList>
        </div>
    );
};

export default PlayQueue;
