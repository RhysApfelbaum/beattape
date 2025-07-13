export class Pointer<T> {
    private data: T | null = null;
    set val(value: T) {
        this.data = value;
    }

    deref(): T {
        if (this.data === null) {
            throw new Error(`Pointer is not initialized!`);
        }
        return this.data!;
    }
}
