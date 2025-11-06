
import React, { useState } from 'react';
import contributors from './contributors.json';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import CreditLink from './CreditLink';

type Contributor = typeof contributors.soundtomb;

const infoPage = (
    <section className="flex flex-col gap-5 text-left overflow-scroll h-[80vh] w-[80vw] md:w-auto">
        <i>Welcome to beattape.net!</i>

        <p>
            This website is
            powered by <CreditLink contributor={contributors.fmod} />
        </p>

        <h3 className="text-base01">Track Sliders</h3>
        <p>
            These sliders represent the feel of the track. If you change them, the next tracks in the play queue will update. For example, if you turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's playing will react if you adjust it.
        </p>

        <h3>Track Sliders</h3>
        <p>
            These sliders represent the feel of the track. If you change them, the next tracks in the play queue will update. For example, if you turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's playing will react if you adjust it.
        </p>

        <h3>Track Sliders</h3>
        <p>
            These sliders represent the feel of the track. If you change them, the next tracks in the play queue will update. For example, if you turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's playing will react if you adjust it.
        </p>

        <h3>Track Sliders</h3>
        <p>
            These sliders represent the feel of the track. If you change them, the next tracks in the play queue will update. For example, if you turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's playing will react if you adjust it.
        </p>


        <h3>Track Sliders</h3>
        <p>
            These sliders represent the feel of the track. If you change them, the next tracks in the play queue will update. For example, if you turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's playing will react if you adjust it.
        </p>
    </section>
);

const Info: React.FC = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {!open && (
                <button
                    onClick={_ => setOpen(true)}
                    className="cursor-pointer hover:animate-pulse transition-all"
                    title="About this site"
                >
                    <FontAwesomeIcon
                        icon={faQuestionCircle}
                        className=""
                        color="var(--base)"
                    />
                </button>
            )}
            <Modal open={open} onClose={() => setOpen(false)}>
                {infoPage}
            </Modal>
        </>
    );
};

export default Info;
