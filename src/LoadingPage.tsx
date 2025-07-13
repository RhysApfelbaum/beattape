import React from 'react';
import TapeReel from './TapeReel';
import Palette from './Palette';
import { AnimatePresence, motion } from 'framer-motion';
import { useFMOD } from './FMODProvider';

const LoadingPage: React.FC = () => {
    const fmod = useFMOD();

    const message = fmod.ready ? 'Click anywhere to start' : 'Loading';

    return (
        <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }} // 👈 Page slides up on exit
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center w-[100vw] h-[100vh]"
        >
            <div className="m-5 flex flex-row items-center gap-3 bg-base01 p-8 rounded">
                <TapeReel spinning className="w-10 h-10" />
                <div className="bg-base07 px-5 py-3 mx-5 rounded">
                    <p className="animate-pulse text-base00 w-20 h-20">
                        {message}
                    </p>
                </div>
                <TapeReel spinning className="w-10 h-10" />
            </div>
        </motion.main>
    );
};

export default LoadingPage;
