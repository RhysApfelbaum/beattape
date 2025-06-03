import { withHtmlLiveReload } from "bun-html-live-reload";



const server = Bun.serve({
    port: 3000,
    fetch: withHtmlLiveReload( async (request) => {
        const url = new URL(request.url);
        const fileName = url.pathname === '/' ? '/index.html' : url.pathname;
        console.log(request);
        const filePath = `./dist${fileName}`;
        return new Response(Bun.file(filePath));
    }),

    error(error) {
        return new Response(
            `<pre>${error.stack}</pre>`,
            { headers: { 'Content-Type': 'text/html' } }
        );
    },

    tls: {
        cert: Bun.file('./test_certificates/cert.pem'),
        key: Bun.file('./test_certificates/key.pem')
    }
});

// watch('./dist', { recursive: true }, async (event, filename) => {
//     console.log(filename);
//     // if (!filename?.endsWith('~')) return;
// });
