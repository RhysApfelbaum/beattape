import React from 'react';

// AHHHHHH
const TapeReel: React.FC<React.ComponentPropsWithoutRef<'div'> & { spinning?: boolean }> = ({ className, spinning = false, ...props }) => {

    const animation = spinning ? 'animate-spin' : 'animate-none';

    return (
        <div className={`${animation} rounded-[50%] bg-base04 relative border-base07 border-3 ${className ?? ''}`}>
            <div
                className='w-[70%] h-[70%] absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-[50%] rotate-[-15deg]'
                style={{
                    background: 'conic-gradient(var(--color-base01) 30deg, transparent 30deg 120deg, var(--color-base01) 120deg 150deg, transparent 150deg 240deg, var(--color-base01) 240deg 270deg, transparent 270deg)'
                }}
            >
            </div>
            <div className='bg-base04 absolute w-[20%] h-[20%] rounded-[50%] top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]'/>
        </div>
    );
};

export default TapeReel;
