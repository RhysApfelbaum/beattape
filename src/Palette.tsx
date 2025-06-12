import React from 'react';
import { hexToRgb, isLight, theme } from './styles/theme';


const Palette: React.FC = () => {
    return (
        <div className='flex fixed bottom-0 w-full'>
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
