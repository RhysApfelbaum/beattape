import React from 'react';
import Button from './Button';
import { usePlayQueue } from './PlayQueueProvider';

const Underflow: React.FC = () => {
    const [playQueue] = usePlayQueue();
    return (
        <Button
            onClick={() => {
                console.log('trying to underflow');
                playQueue.currentTrack.sounds.testUnderflow();
            }}
        >
            <p className="text-base00 p-5">UNDERFLOW</p>
        </Button>
    );
};

export default Underflow;
