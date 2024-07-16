import React from 'react';
import styled from 'styled-components';
import { usePlayQueue } from './PlayQueueProvider';
import contributors from './contributors.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink } from '@fortawesome/free-solid-svg-icons';

const Credit = styled.li`
    list-style-type: none;
    margin-bottom: 8px;

    strong {
        font-weight: bold;
        color: ${props => props.theme.colors.brightLight}; /* Use theme color */
    }

    a {
        color: ${props => props.theme.colors.lightTint}; /* Use theme color */
        text-decoration: none;
        &:hover {
            text-decoration: underline;
        }
    }
`;

const CreditsBox = styled.ul`
    border: 1px solid ${props => props.theme.colors.brightLight};
    border-radius: 5px;
    width: 40%;
    padding: 10px;
    margin: 0;
`;

type Contributor = typeof contributors.soundtomb;

const CreditBox: React.FC<{ artist: string }> = ({ artist }) => {
    const [ playQueue, _ ] = usePlayQueue();


    const artistInfo = contributors[artist as keyof typeof contributors];

    // It's just me for now
    const musicInfo = contributors.soundtomb;

    return (
        <CreditsBox>
            <Credit>
                <strong>Music by </strong>
                <a href={musicInfo.link} target="_blank" rel="noreferrer noopener">
                    {musicInfo.name} &rarr;
                </a>
            </Credit>
            <Credit>
                <strong>Artwork by </strong>
                <a href={artistInfo.link} target="_blank" rel="noreferrer noopener">
                    {artistInfo.name} &rarr;
                </a>
            </Credit>
        </CreditsBox>
    );
};

export default CreditBox;
