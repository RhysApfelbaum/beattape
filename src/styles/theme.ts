import themes from './themes.json';
import { assertNotNull } from '../fmod/helpers';

export type ThemeKey = number | 'auto';

export const getThemeKey = (): ThemeKey => {
    const text = localStorage.getItem('theme');
    assertNotNull(text);

    if (text === 'auto') return 'auto';

    const parsed = Number.parseInt(text);
    if (Number.isNaN(parsed)) {
        throw new Error(`Invalid theme value in localStorage: ${text}`);
    }
    return parsed;
}

export type Theme = typeof themes[number];

export const applyTheme = (theme: Theme) => {
    Object.entries(theme.palette).forEach(([colorName, hex]) => {
        document.documentElement.style.setProperty(
            `--color-${colorName}`,
            hex,
        );
    });
};


export type RGB = [number, number, number];

export const hexToRgb = (hex: string): RGB => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
};

export const isLight = (color: RGB) =>
    color[0] + color[1] + color[2] > 255 * 1.5;
