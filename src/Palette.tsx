import React from 'react';
import { hexToRgb, isLight, theme } from './styles/theme';


const Palette: React.FC<{ position?: 'bottom' | 'top' }> = ({ position = 'bottom' }) => {
    const pos = position === 'top' ? 'top-0' : 'bottom-0';

    return (
        <div className={'flex fixed left-0 w-full ' + pos}>
            {
                Object.keys(theme).map(key => {
                    const color = theme[key as keyof typeof theme];
                    const textColor = isLight(hexToRgb(color)) ? 'text-base02' : 'text-base07';
                    return (
                        <div key={key}
                            className={'flex-grow w-auto h-20 flex flex-col justify-center'}
                            style={{
                                backgroundColor: color
                            }}>
                            <p className={textColor}>{key}</p>
                            <p className={textColor}>{color}</p>
                        </div>
                    )

                })
            }
        </div>
    );
};

export default Palette;
