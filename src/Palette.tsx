import React from 'react';
import theme from './theme'; 

const Palette: React.FC = () => {
    const colors: any = theme.colors;
    console.log(colors);
    return (
        <div style={{

            display: 'flex',
            flexDirection: 'row'
        }}>
            {
                Object.keys(colors).map(key => (
                    <div key={key} style={{
                        backgroundColor: colors[key],
                        width: 100,
                        height: 100,
                        border: '2px black solid',
                    }}>
                        <p style={{ margin: '0 0 0 0', paddingTop: 30 }}>{key}</p>
                        <p style={{ margin: '0 0 0 0' }}>{colors[key]}</p>
                    </div>
                ))
            }
        </div>
    );
};

export default Palette;
