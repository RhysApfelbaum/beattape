import { unreachable } from "../src/fmod/helpers";

const url = '';
export class Readers {
    record: Map<number, { response: Response, reader: ReadableStreamBYOBReader}>;

    constructor() {
        this.record = new Map();
    }

    get(id: number) {
        const connection = this.record.get(id);
        if (!connection) {
            const response = await fetch(url)
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
        // return connection.getReader()
    }
}

class Connection {
    response: Promise<Response>;
    reader: Promise<ReadableStreamBYOBReader>;
    url: string;

    constructor(url: string) {
        this.url = url;
        // this.response = fetch(url);
        // fetch(url);
        this.response = fetch(this.url);
        this.reader = this.response.then(response => {
        });
        this.restart();
    }

    restart() {
        this.response = fetch(this.url);
        this.reader = this.response.then(response => {
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
                );
            }

            if (!response.body) {
                throw new Error(`Failed to fetch ${url}: No response body`);
            }
            return response.body?.getReader({ mode: 'byob' });
        });
    }

}
