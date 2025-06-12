import React from 'react';
import contributors from './contributors.json';
import './styles/credits.css';

const CreditBox: React.FC<{ artist: string }> = ({ artist }) => {

    const artistInfo = contributors[artist as keyof typeof contributors];

    // It's just me for now
    const musicInfo = contributors.soundtomb;

    return (
        <ul className='credits'>
            <li>
                <strong>Music by </strong>
                <a
                    href={musicInfo.link}
                    target="_blank"
                    rel="noreferrer noopener"
                >
                    {musicInfo.name} &rarr;
                </a>
            </li>
            <li>
                <strong>Artwork by </strong>
                <a href={artistInfo.link} target="_blank" rel="noreferrer noopener">
                    {artistInfo.name} &rarr;
                </a>
            </li>
        </ul>
    );
};

export default CreditBox;
