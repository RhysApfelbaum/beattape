export class Connection {
    reader: Promise<ReadableStreamBYOBReader>;
    private url: string;

    constructor(url: string) {
        this.url = url;
        this.reader = this.newReader();
    }

    private async newReader() {
        const response = await fetch(this.url);
        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${this.url}: ${response.status} ${response.statusText}`,
            );
        }

        if (!response.body) {
            throw new Error(`Failed to fetch ${this.url}: No response body`);
        }
        return response.body.getReader({ mode: 'byob' });
    }

    restart() {
        this.reader = this.newReader();
    }
}
