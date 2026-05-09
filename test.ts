const res = await fetch('localhost:1234');

const reader = res.body!.getReader({ mode: 'byob' });
let headerBuffer = new ArrayBuffer(9)
let packetBuffer = new ArrayBuffer(255);

const controller = new ReadableByteStreamController();

let i = 0;
while (true) {
    const { value: header } = await reader.read(new Uint8Array(headerBuffer));
    headerBuffer = header!.buffer as ArrayBuffer;
    const ok = header![0];
    const length = Number.parseInt(header!.slice(1, 9).toHex(), 16);
    const { done, value: packet } = await reader.read(new Uint8Array(headerBuffer));
    if (done || i == 4) {
        break;
    }
    console.log(packet.slice(0, length));
    i++;
}
