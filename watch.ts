import chokidar from 'chokidar';

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
