
import React, { SetStateAction, useEffect, useState } from 'react';
import contributors from './contributors.json';
import artData from './art.json';

import { Navigation, Scrollbar } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import Modal from './Modal';
import Button from './Button';
import { useIsMobile } from './fmod/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

type Contributor = typeof contributors.soundtomb;

const Info: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {!open && (
                <button onClick={_ => setOpen(true)}>
                    <FontAwesomeIcon
                        icon={faQuestionCircle}
                        className=""
                        color="var(--base)"
                    />
                </button>
            )}
            <Modal open={open} onClose={() => setOpen(false)}>
                <h2>Welcome to beattape.net</h2>
            </Modal>
        </>
    );
};

export default Info;
