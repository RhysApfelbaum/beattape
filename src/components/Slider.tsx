import React, { ChangeEvent, MouseEvent } from 'react';

const Slider: React.FC<{
    update: (value: number) => any,
    onMouseUp?: (value: number) => any,
    label: string,
    activation: string,
    className?: string
}> = ({ update, onMouseUp = (value: number) => {}, label, activation, className = '' }) => {

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        update(parseInt(event.target.value) / 100);
    };

    const handleMouseUp = (event: MouseEvent) => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        onMouseUp(parseInt(target.value) / 100);
    };

    console.log(activation);

    return (
        <div
            className={'flex flex-col relative overflow-clip items-center h-40 justify-start ' + className}
            style={{ '--activation': activation } as React.CSSProperties}
        >
            <div className="slider-shadow">
                <div className="slider-track" />
                <input
                    type="range"
                    className="slider-input"
                    onChange={handleChange}
                    onMouseUp={handleMouseUp}
                />
            </div>

            {/* Spacer */}
            <span className='h-[100px]' />

            <p className="slider-text">{label}</p>
        </div>
    );
};

export default Slider;
