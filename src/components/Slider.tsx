import React, { ChangeEvent } from 'react';
import styled from 'styled-components';

const SliderInput = styled.input`
    -webkit-appearance: none; 
    -moz-appearance: none;
    appearance: none;
    width: 100px;
    height: 50px;
    margin: 0 0 0 0 !important;
    transform: translateY(17px) rotate(270deg);
    transform-origin: center;
    background: transparent;
    position: relative;

    @-moz-document url-prefix() {
        transform: translateY(25px) rotate(270deg);
    }

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 5px;
        /* background: var(--slider-thumb-background); */
        background: hsl(120, 100%, var(--activation));
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

        background: hsl(120, 100%, );
        height: 20px;
        border-radius: 2px;
        position: relative;
        z-index: 100;
        border: none;
        cursor: pointer;
        pointer-events: all;
    }
`;

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

const Slider: React.FC<{
    update: (value: number) => any,
    label: string,
    activation: string
}> = ({ update, label, activation }) => {

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        update(parseInt(event.target.value) / 100);
    };

    return (
        <div>
            <SliderShadow style={{ '--activation': activation } as React.CSSProperties}>
                <SliderTrack />
                <SliderInput
                    type="range"
                    id="brightness"
                    className="slider"
                    onChange={handleChange}
                />
            </SliderShadow>
            <br />
            <p style={{ textAlign: 'center' }}>{label}</p>
        </div>
    );
};

export default Slider;
