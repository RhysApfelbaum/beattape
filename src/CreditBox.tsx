import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';
import theme from './theme';
import { usePlayQueue } from './PlayQueueProvider';

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
    border-radius: 5px;;
    width: 40%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: ${props => props.theme.colors.background};
    padding: 10px;
    z-index: 100;
`;


const Credits: React.FC<{ showing: boolean, handleClose: () => void }> = ({ showing, handleClose }) => {
    const [ playQueue, _ ] = usePlayQueue();

    return (
        <CreditsBox>
            <Credit>
                <strong>Website and Music: </strong>
                <a href="https://soundtomb.bandcamp.com/" target="_blank" rel="noreferrer noopener">
                    Soundtomb
                </a>
            </Credit>
            <Credit>
                <strong>Art: </strong>
                <a href="https://www.midjourney.com/app/" target="_blank" rel="noreferrer noopener">
                    Midjourney
                </a>
            </Credit>
        </CreditsBox>
    );
};

export default Credits;
