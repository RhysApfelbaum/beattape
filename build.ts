import { argv, $ } from 'bun';
import tailwind from 'bun-plugin-tailwind';
import { watch, mkdirSync, existsSync } from 'fs';

const staticDirectory = './static';
const outputDirectory = './dist';
const build = async () => {
    console.log(`Copying ${staticDirectory} to ${outputDirectory}`);
    await $`cp -R ${staticDirectory}/* ${outputDirectory}`;
    console.log('Building...');

    const result = await Bun.build({
        entrypoints: [ './src/index.html' ],
        sourcemap: 'linked',
        outdir: outputDirectory,
        plugins: [tailwind],
        target: 'browser',
        minify: false,
    });

    if (result.success) {
        console.log('Build successful! Outputs:');
        result.outputs.map(output => console.log(output.path));
    } else {
        result.logs.map(message => console.error(message));
    }
};

if (existsSync(outputDirectory)) {
    console.log(`Removing the contents of ${outputDirectory}`);
    await $`rm -rf ${outputDirectory}/*`;
} else {
    console.log(`Creating ${outputDirectory}`);
    mkdirSync(outputDirectory, { recursive: true });
}

await build();

if (argv.includes('--watch')) {
    watch('./src', { recursive: true }, async (event, filename) => {
        if (!filename?.endsWith('~')) return;
        await build();
    });
}
