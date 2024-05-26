import styled from 'styled-components';

const BUTTON_SHADOW = 5;
const BUTTON_SHADOW_ACTIVE = 2;
const BUTTON_SHADOW_OFFSET = BUTTON_SHADOW - BUTTON_SHADOW_ACTIVE;
const Button = styled.button`
    border-radius: 3px;
    box-shadow: ${BUTTON_SHADOW}px ${BUTTON_SHADOW}px ${props => props.theme.colors.warmTint};
    font-family: inherit;
    font-weight: bold;
    background-color: rgb(255, 238, 222);
    color: rgba(0, 0, 0, 0.801);
    margin: 5px 5px 5px 5px;

    &:active {
        box-shadow: ${BUTTON_SHADOW_ACTIVE}px ${BUTTON_SHADOW_ACTIVE}px ${props => props.theme.darkTint};
        font-weight: bolder;
        background-color: ${props => props.theme.colors.lightTint};
        
        /* This compensates for the shadow shrinking, and makes it look like the button is being pressed down.
        It should be set to the difference between the box shadow when the button is active vs not active. */
        translate: ${BUTTON_SHADOW_OFFSET}px ${BUTTON_SHADOW_OFFSET}px;
    }
`;

export default Button;
