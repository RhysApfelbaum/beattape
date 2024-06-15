import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';
import theme from './theme';

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

const Blur = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3); /* Semi-transparent black background */
    backdrop-filter: blur(5px); /* Apply blur effect */
    z-index: 99; /* Ensure the blur layer is behind the CreditsBox */
    transition: fade in;
`;

const Close = styled.button`
    appearance: none;
    background-color: transparent;
    border: none;
    position: absolute;
    right: 1%;
    top: 4%;
    --close-button-color: ${props => props.theme.colors.brightLight};

    &:hover {
        --close-button-color: ${props => props.theme.colors.warmLight};
    }
`;

const Credits: React.FC<{ showing: boolean, handleClose: () => void }> = ({ showing, handleClose }) => {
    return showing && (
        <>
            <Blur onClick={handleClose}/>
            <CreditsBox>
                <Close onClick={handleClose}>
                    <FontAwesomeIcon icon={faCircleXmark} color='var(--close-button-color)' />
                </Close>
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
        </>
    );
};

export default Credits;
