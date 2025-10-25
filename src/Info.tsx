
import React, { useState } from 'react';
import contributors from './contributors.json';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import CreditLink from './CreditLink';

type Contributor = typeof contributors.soundtomb;

const Info: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {!open && (
                <button
                    onClick={_ => setOpen(true)}
                    className="cursor-pointer hover:animate-pulse transition-all"
                >
                    <FontAwesomeIcon
                        icon={faQuestionCircle}
                        className=""
                        color="var(--base)"
                    />
                </button>
            )}
            <Modal open={open} onClose={() => setOpen(false)}>
                <section className="flex-column gap-5 text-left">
                    <i>Welcome to beattape.net!</i>

                    <p>
                        This website is
                        powered by <CreditLink contributor={contributors.fmod} />
                    </p>

                </section>
            </Modal>
        </>
    );
};

export default Info;
