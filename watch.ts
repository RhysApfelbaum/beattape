import styleLoader from 'bun-style-loader';
import chokidar from 'chokidar';
import { unlink, readdir } from 'node:fs/promises';

chokidar.watch('./src', {
    usePolling: false
}).on('all', async (event, path) => {
    console.log(event, path);
});


    // readdir('./src');
    // Bun.build({
    //     entrypoints: [ './src/index.tsx' ],
    //     sourcemap: 'external',
    //     outdir: './dist',
    //     plugins: [ styleLoader() ],
    // });
