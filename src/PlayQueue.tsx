import React, { useEffect, useState } from 'react';
import { getNextTracks, usePlayQueue } from './PlayQueueProvider';
import { Track } from './fmod/track';
import { SliderState } from './fmod/sliderState';
import styled, { keyframes, useTheme } from 'styled-components';



const ItemList = styled.ul`
    list-style-type: none;
    border-radius: 5px;
    padding: 5px 5px 5px 5px;
    outline: 1px solid ${props => props.theme.colors.brightLight};
`;

const PlayQueue: React.FC = () => {

    const [ playQueue, setPlayQueue ] = usePlayQueue();

    const theme = useTheme();

    const TrackChangedAnimation = keyframes`
        from {
            color: ${theme.colors.lightTint};
        } to {
            color: ${theme.colors.brightLight};
        }
    `;

    const ChangedItem = styled.li`
        animation: ${TrackChangedAnimation} 1s;
    `;

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
