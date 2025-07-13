import React from 'react';
import contributors from './contributors.json';
import './styles/credits.css';
import CreditLink from './CreditLink';

const CreditBox: React.FC<{ artist: string }> = ({ artist }) => {
    const artistInfo = contributors[artist as keyof typeof contributors];

    // It's just me for now
    const musicInfo = contributors.soundtomb;

    return (
        <ul className="credits">
            <li>
                <strong>Music by </strong>
                <CreditLink contributor={contributors.soundtomb} />
            </li>
            <li>
                <strong>Artwork by </strong>
                <CreditLink contributor={artistInfo} />
            </li>
        </ul>
    );
};

export default CreditBox;
