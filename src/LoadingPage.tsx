import React from "react";
import TapeReel from "./TapeReel";
import Palette from "./Palette";


const LoadingPage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <main className='flex flex-col items-center justify-center w-[100vw] h-[100vh]'>
            <div className='m-5 flex flex-row items-center gap-3 bg-base01 p-8 rounded'>
                <TapeReel spinning className='w-10 h-10'/>
                <div className='bg-base07 px-5 py-3 mx-5 rounded'>
                    <p className="animate-pulse text-base00 w-20 h-20">{message}</p>
                </div>
                <TapeReel spinning className='w-10 h-10'/>
            </div>
        </main>
    );
};

export default LoadingPage;
