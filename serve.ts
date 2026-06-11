import path from 'path';

const server = Bun.serve({
    port: 3000,
    fetch(req) {
        const url = new URL(req.url);

        const index = url.pathname === '/' ? 'index.html' : '';
        const filePath = path.join('./dist', url.pathname, index);

        return new Response(Bun.file(filePath), {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
            },
        })
    },

    error(error) {
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
