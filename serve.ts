import { type HTMLBundle } from 'bun';

import index from './src/index.html';

const server = Bun.serve({
    port: 3000,
    routes: {
        '/': index,
        '/*': async req => {
            const url = new URL(req.url);
            return new Response(Bun.file(`./static${url.pathname}`), {
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }
    },

    error: error => {
        return Response.json(
            error,
            { headers: { 'Content-Type': 'text/json' } }
        );
    },

    tls: {
        cert: Bun.file('./test_certificates/cert.pem'),
        key: Bun.file('./test_certificates/key.pem')
    },

    development: {
        console: true,
        hmr: true
    },
});

console.log(`Started beattape dev server on https://127.0.0.1:${server.port}`)
