import React, { useState } from 'react';
import Button from "./Button";
import theme from './theme';
import { useTheme } from 'styled-components';

const Toggle: React.FC<{ action: (pressed: boolean) => void }> = ({ action }) => {
    const [ pressed, setPressed ] = useState(false);

    const toggleLight = '#e87356';

    const theme = useTheme();

    return (
        <Button
            onClick={() => {
                action(!pressed);
                setPressed(!pressed);
            }}
            style={{
                width: 30,
                height: 30,
                margin: 10,
            }}
        >
            <div style={{
                width: '8px',
                height: '8px',
                margin: '2px 3px 3px 3px',
                backgroundColor: pressed ? theme.colors.warmLight : theme.colors.dark,
                borderRadius: '2px',
                boxShadow: 'none'
            }}></div>
        </Button>
    );
};

export default Toggle;
