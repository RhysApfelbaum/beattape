
import React, { useState } from 'react';
import contributors from './contributors.json';
import Modal from './Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import CreditLink, { Link } from './CreditLink';

type Contributor = typeof contributors.soundtomb;

const infoPage = (
    <section className="flex flex-col gap-5 text-left overflow-scroll h-[80vh] w-[80vw] md:w-auto md:p-20">
        <h3 className='text-base06 font-semibold'><i>Welcome to beattape.net!</i></h3>

        <p>
            I'm <CreditLink contributor={contributors.soundtomb}/>, and this is
            my interactive music site, powered by <CreditLink
                contributor={contributors.fmod} />.
        </p>
        <p>
            The tracks you're hearing aren't fully generative, and they aren't
            fully static. They're somewhere inbetween. You'll have to explore
            to find out...
        </p>
        <p>
            Here's a short explanation of what some of the controls do.
        </p>

        <h3 className='text-base06 font-semibold'><i>Track Sliders</i></h3>
        <p>
            These sliders represent the feel of the track. If you change them,
            the next tracks in the play queue will update. For example, if you
            turn up the "Grit" slider, the next tracks will be more gritty.
        </p>
        <p>
            If a slider starts glowing, that means that the track that's
            playing will react if you adjust it.
        </p>

        <h3 className='text-base06 font-semibold'><i>Ambience Sliders</i></h3>
        <p>
            These sliders let you play ambient sounds in the background.
        </p>

        <h3 className='text-base06 font-semibold'><i>Effects</i></h3>
        <p>
            These affect the track playing, but not the ambience.
        </p>
        <hr />
        <p>
            I'm always looking for new art or music to host here. If that
            sounds like something you'd be interested in, or if you have any
            questions, feel free to send me an <Link
                href="mailto:soundtomb1@gmail.com" text="email" />.
        </p>

        <p>
            Besides me, here are the people who have contributed art or music so far:
        </p>
        <ul>
            {Object.values(contributors).map(contributor => {
                if (contributor.name !== 'Soundtomb' && contributor.person ) {
                    return <li
                        key={contributor.name}
                    >
                        - <CreditLink contributor={contributor} />
                    </li>
                }
            })}
        </ul>
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
