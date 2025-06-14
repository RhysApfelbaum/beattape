import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import styles from './styles/credits.module.css';


const Credits: React.FC<{ showing: boolean, handleClose: () => void }> = ({ showing, handleClose }) => {
    return showing && (
        <>
            <div onClick={handleClose} className={styles.credits}/>
            <ul className={styles.credits}>
                <button onClick={handleClose}>
                    <FontAwesomeIcon icon={faCircleXmark} color='var(--close-button-color)' />
                </button>
                <li>
                    <strong>Website and Music: </strong>
                    <a href="https://soundtomb.bandcamp.com/" target="_blank" rel="noreferrer noopener" className={styles.link}>
                        Soundtomb
                    </a>
                </li>
                <li>
                    <strong>Art: </strong>
                    <a href="https://www.midjourney.com/app/" target="_blank" rel="noreferrer noopener" className={styles.link}>
                        Midjourney
                    </a>
                </li>
            </ul>
        </>
    );
};

export default Credits;
