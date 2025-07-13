import React, { useState } from 'react';
import Button from './Button';

const Toggle: React.FC<{ action: (pressed: boolean) => void }> = ({
    action,
}) => {
    const [pressed, setPressed] = useState(false);

    const lightColor = pressed ? 'bg-base08' : 'bg-base03';

    return (
        <Button
            className="w-8 h-8"
            onClick={() => {
                action(!pressed);
                setPressed(!pressed);
            }}
        >
            <div
                className={lightColor + ' w-2 h-2 rounded-[2px]'}
                style={{
                    width: '8px',
                    height: '8px',
                    margin: '2px 3px 3px 3px',
                    backgroundColor: pressed
                        ? 'var(--color-base0A)'
                        : 'var(--color-base00)',
                    borderRadius: '2px',
                    boxShadow: 'none',
                }}
            />
        </Button>
    );
};

export default Toggle;
