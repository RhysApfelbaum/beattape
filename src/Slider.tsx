import React, { useState, ChangeEvent }  from 'react';
import './Slider.css';
import { useFMOD } from './FMODProvider';

const Slider: React.FC<{ update: (value: number) => any }> = ({ update }) => {
    const fmod = useFMOD();

    const [ value, setValue ] = useState<number>(0.5);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setValue(parseInt(event.target.value) / 100);
    };

    update(value);
    
    return (
        <div className="slider-container">
            <div className="slider-track" />
            <input
                type="range"
                id="brightness"
                className="slider"
                onChange={handleChange}
            />
        </div>
    );
};

export default Slider;
