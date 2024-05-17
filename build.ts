import { argv, $ } from 'bun';
import styleLoader from 'bun-style-loader';
import { watch } from 'fs';


const staticDirectory = './static';
const outputDirectory = './dist';
const build = async () => {
    console.log(`Copying ${staticDirectory} to ${outputDirectory}`);
    await $`cp -R ${staticDirectory}/* ${outputDirectory}`;
    console.log('Building...');
    const result = await Bun.build({
        entrypoints: [ './src/index.tsx' ],
        sourcemap: 'external',
        outdir: outputDirectory
    });

    if (result.success) {
        console.log('Build successful! Outputs:');
        result.outputs.map(output => console.log(output.path));
    } else {
        result.logs.map(message => console.error(message));
    }
};

console.log(`Removing the contents of ${outputDirectory}`);
await $`rm -rf ${outputDirectory}/*`;

build();

if (argv.includes('--watch')) {
    watch('./src', { recursive: true }, async (event, filename) => {
        if (!filename?.endsWith('~')) return;
        await build();
    });
}
