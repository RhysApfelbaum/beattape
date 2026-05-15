async function getReader(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
        );
    }

    if (!response.body) {
        throw new Error(`Failed to fetch ${url}: No response body`);
    }
    return response.body?.getReader({ mode: 'byob' });
}


export default class Connection {
    private url: string;
    reader: Promise<ReadableStreamBYOBReader>;

    constructor(url: string) {
        this.url = url;
        this.reader = getReader(url);
    }

    restart() {
        this.reader = getReader(this.url);
    }
}
