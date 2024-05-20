import React, { useState, ChangeEvent, useEffect }  from 'react';
import sliderInputStyle from './SliderInput.css' with { type: 'text' };
import sliderContainerStyle from './SliderContainer.css' with { type: 'text' };
import styled from 'styled-components';
import { useFMOD } from '../FMODProvider';


const Slider: React.FC<{ update: (value: number) => any }> = ({ update }) => {
    const fmod = useFMOD();

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        update(parseInt(event.target.value) / 100);
    };

    const SliderInput = styled.input`
        -webkit-appearance: none; 
        appearance: none;
        width: 100px;
        height: 50px;
        margin: 0 0 0 0 !important;
        --slider-thumb-background: 'gray';
        transform: translateY(25px) rotate(270deg);
        transform-origin: center;
        -webkit-transform: translateY(17px) rotate(270deg);
        -webkit-transform-origin: center;
        -moz-transform: translateY(25px) rotate(270deg);
        background: transparent;
        position: relative;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 5px;
            /* background: var(--slider-thumb-background); */
            background: grey;
            height: 20px;
            transform: translateX(-8px);
            border-radius: 2px;
        }

        &::-webkit-slider-runnable-track {
            -webkit-appearance: none;
        }

        &::-moz-range-track {
            -moz-appearance: none;
        }

        &::-moz-range-thumb {
            -moz-appearance: none transparent;
            -moz-transform: none;
            width: 5px;
        
            background: hsl(120, 100%, var(--grit));
            height: 20px;
            border-radius: 2px;
            position: relative;
            z-index: 100;
            border: none;
            cursor: pointer;
            pointer-events: all;
        }
    `;
            // background: hsl(120 100% ${brightness});

    const SliderTrack = styled.div`
        position: absolute;
        background-color: #2e2e2ee5;
        margin-left: 48px;
        height: 100px;
        width: 4px;
        border-radius: 2px;
        border: none;
    `;

    const SliderShadow = styled.div`
        width: 100px;
        border-radius: 5px;
        margin-bottom: 10px;
        filter: drop-shadow(0 0 10px rgb(255, 238, 222));
    `;

    return (
        <SliderShadow>
            <SliderTrack />
            <SliderInput
                type="range"
                id="brightness"
                className="slider"
                onChange={handleChange}
            />
        </SliderShadow>
    );
};

export default Slider;
