import React, { useState } from 'react';
import styles from './styles/button.module.css';


const Toggle: React.FC<{ action: (pressed: boolean) => void }> = ({ action }) => {
    const [ pressed, setPressed ] = useState(false);

    const lightColor = pressed ? 'bg-base08' : 'bg-base03';

    return (
        <button
            onClick={() => {
                action(!pressed);
                setPressed(!pressed);
            }}
            className={styles.button + ' w-8 h-8'}
        >
            <div className={lightColor + ' w-2 h-2 rounded-[2px]'} style={{
                // width: '8px',
                // height: '8px',
                // margin: '2px 3px 3px 3px',
                // // backgroundColor: pressed ? theme.colors.warmLight : theme.colors.dark,
                // borderRadius: '2px',
                // boxShadow: 'none'
            }} />
        </button>
    );
};

export default Toggle;
