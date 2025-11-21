import { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeKey, applyTheme, getThemeKey } from './styles/theme';
import themes from './styles/themes.json';
import artData from './art.json';
import { assertNotNull } from './fmod/helpers';

export const ThemeContext = createContext({
    theme: themes[0],
    art: artData[0],
    themeKey: 0 as ThemeKey,
    artKey: 0,
    setThemeKey: (() => {}) as React.Dispatch<React.SetStateAction<ThemeKey>>,
    setArtKey: (() => {}) as React.Dispatch<React.SetStateAction<number>>
});


export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [themeKey, setThemeKey] = useState<ThemeKey>('auto');
    const [artKey, setArtKey] = useState(
        Math.floor(Math.random() * (Object.keys(artData).length - 2)),
    );

    const art = artData[artKey];
    const [theme, setTheme] = useState(themes[art.themeKey]);

    useEffect(() => {
        let index: number;
        if (themeKey === 'auto') {
            //TODO
            index = art.themeKey;
        } else {
            index = themeKey;
        }

        const newTheme = themes[index];
        setTheme(newTheme);
        applyTheme(newTheme);
        localStorage.setItem('theme', index.toString());
    }, [themeKey, artKey]);

    return (
        <ThemeContext.Provider value={{
            theme,
            art,
            themeKey,
            artKey,
            setThemeKey,
            setArtKey}}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
