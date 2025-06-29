import React, { ChangeEvent, MouseEvent } from 'react';
import styled from 'styled-components';

// This is the worst thing in the world;
// May I never again have to look at this mind-grating, janky mess.
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
    --thumb-background: color-mix(
        in srgb, 
        var(--color-base03),
        var(--color-base0A)
        var(--activation)
    );

    /* Butt-ugly hack to make the sliders line up in firefox */
    @-moz-document url-prefix() {
        transform: translateY(25px) rotate(270deg);
    }

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 5px;
        background: var(--thumb-background);
        height: 20px;
        transform: translateX(-8px);
        border-radius: 2px;
    }

    &::-moz-range-thumb {
        -moz-appearance: none transparent;
        -moz-transform: none;
        width: 5px;
        background: var(--thumb-background);

        height: 20px;
        border-radius: 2px;
        position: relative;
        z-index: 100;
        border: none;
        cursor: pointer;
        pointer-events: all;
    }

    /* Make the default slider track invisible because it'll be replaced by a custom element. */
    &::-webkit-slider-runnable-track {
        -webkit-appearance: none;
    }

    &::-moz-range-track {
        -moz-appearance: none;
    }
`;

const SliderTrack = styled.div`
    position: absolute;
    background-color: color-mix(
        in srgb, 
        var(--color-base03),
        var(--color-base0A)
        var(--activation)
    );
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
    filter: drop-shadow(0 0 10px color-mix(
        in srgb,
        rgb(255, 238, 222, 0),
        rgb(255, 238, 222, 1)
        var(--activation)
    ));
`;

const SliderText = styled.p`
    text-align: center;
    color: color-mix(
        in srgb, 
        var(--color-base03),
        var(--color-base05)
        var(--activation)
    );
`;


const Slider: React.FC<{
    update: (value: number) => any,
    onMouseUp?: (value: number) => any,
    label: string,
    activation: string
}> = ({ update, onMouseUp = (value: number) => {}, label, activation }) => {

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        update(parseInt(event.target.value) / 100);
    };

    const handleMouseUp = (event: MouseEvent) => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        onMouseUp(parseInt(target.value) / 100);
    };

    return (
        <div style={{
            width: 100,
            display: 'grid',
            gridTemplateRows: '100px 50px',
            '--activation': activation
        } as React.CSSProperties}>
            <SliderShadow>
                <SliderTrack />
                <SliderInput type="range" onChange={handleChange} onMouseUp={handleMouseUp}/>
            </SliderShadow>
            <SliderText>{label}</SliderText>
        </div>
    );
};

export default Slider;
