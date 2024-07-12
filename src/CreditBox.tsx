import React from 'react';
import styled from 'styled-components';
import { usePlayQueue } from './PlayQueueProvider';
import contributors from './contributors.json';

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
`;

type Contributor = typeof contributors.soundtomb;

const CreditBox: React.FC<{ artist: string }> = ({ artist }) => {
    const [ playQueue, _ ] = usePlayQueue();

    const artistInfo = contributors[artist as keyof typeof contributors];
    return (
        <CreditsBox>
            <Credit>
                <strong>Music by </strong>
                <a href="https://soundtomb.bandcamp.com/" target="_blank" rel="noreferrer noopener">
                    Soundtomb
                </a>
            </Credit>
            <Credit>
                <strong>Artwork by </strong>
                <a href={artistInfo.link} target="_blank" rel="noreferrer noopener">
                    {artistInfo.name}
                </a>
            </Credit>
        </CreditsBox>
    );
};

export default CreditBox;
