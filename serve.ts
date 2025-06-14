import { type HTMLBundle } from 'bun';

import index from './src/index.html';


console.log(index as HTMLBundle);

const server = Bun.serve({
    port: 3000,
    // fetch: async (request) => {
    //     const url = new URL(request.url);
    //     const fileName = url.pathname === '/' ? '/index.html' : url.pathname;
    //     const filePath = `./dist${fileName}`;
    //     return new Response(Bun.file(filePath));
    // },
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


// watch('./dist', { recursive: true }, async (event, filename) => {
//     console.log(filename);
//     // if (!filename?.endsWith('~')) return;
// });
