import { watch, mkdirSync, existsSync } from 'fs';

const server = Bun.serve({
    port: 3000,
    fetch(request) {
        const url = new URL(request.url);
        const fileName = url.pathname === '/' ? '/index.html' : url.pathname;
        const filePath = `./dist${fileName}`;
        try {
            const file = Bun.file(filePath);
            return new Response(file);
        } catch (error) {
            return new Response('File not found', { status: 404 });
        }
    }
});

watch('./dist', { recursive: true }, async (event, filename) => {
    console.log(filename);
    // if (!filename?.endsWith('~')) return;
});
