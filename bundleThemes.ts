import { readdir } from 'fs/promises';
import { join } from 'path';
import { parse } from 'yaml';

const baseDir = './src/styles/';
const themesDir = join(baseDir, 'themes/base16')
const filenames = await readdir(themesDir);

const themes = await Promise.all(
    filenames
        .filter(filename => filename.endsWith('.yaml'))
        .map(async filename => {
            const text = await Bun.file(join(themesDir, filename)).text();
            return parse(text);
        })
);

await Bun.write(join(baseDir, 'themes.json'), JSON.stringify(themes));

