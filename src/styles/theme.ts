export const theme = {
    base00: '',
    base01: '',
    base02: '',
    base03: '',
    base04: '',
    base05: '',
    base06: '',
    base07: '',
    base08: '',
    base09: '',
    base0A: '',
    base0B: '',
    base0C: '',
    base0D: '',
    base0E: '',
    base0F: '',
};

Object.keys(theme).forEach(key => {
    theme[key as keyof typeof theme] = getComputedStyle(document.documentElement)
        .getPropertyValue(`--color-${key}`);
});

export const setTheme = (newTheme: typeof theme) => {
    Object.keys(newTheme).forEach(key => {
        document.documentElement.style.setProperty(`--color-${key}`, newTheme[key as keyof typeof newTheme]);
        theme[key as keyof typeof theme] = newTheme[key as keyof typeof newTheme];
    });
};

export type RGB = [number, number, number];

export const hexToRgb = (hex: string): RGB => {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

export const isLight = (color: RGB) => color[0] + color[1] + color[2] > 255 * 1.5;

export const themes: Record<string, typeof theme> = {
    catppuccinMocha: {
        base00: '#1e1e2e',
        base01: '#181825',
        base02: '#313244',
        base03: '#45475a',
        base04: '#585b70',
        base05: '#cdd6f4',
        base06: '#f5e0dc',
        base07: '#b4befe',
        base08: '#f38ba8',
        base09: '#fab387',
        base0A: '#f9e2af',
        base0B: '#a6e3a1',
        base0C: '#94e2d5',
        base0D: '#89b4fa',
        base0E: '#cba6f7',
        base0F: '#f2cdcd',
    }
}
