import { type HTMLBundle } from 'bun';

import index from './src/index.html';

const server = Bun.serve({
    port: 3000,
    routes: {
        '/': index,
        '/*': async (req) => {
            const url = new URL(req.url);
            return new Response(Bun.file(`./static${url.pathname}`), {
                headers: { 'Access-Control-Allow-Origin': '*' },
            });
        },
    },

    error: (error) => {
        let status = 500;

        if (error?.code === 'ENOENT') {
            status = 404;
        } else if (error?.code === 'EACCES') {
            status = 403;
        }

        return Response.json(
            {
                message: error.message,
                code: error.code,
                errno: error.errno,
                stack: error.stack,
            },
            {
                status,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    },

    tls: {
        cert: Bun.file('./test_certificates/cert.pem'),
        key: Bun.file('./test_certificates/key.pem'),
    },

    development: {
        console: false,
        hmr: true,
    },
});

console.log(`Started beattape dev server on https://127.0.0.1:${server.port}`);
