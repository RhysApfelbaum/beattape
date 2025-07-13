export class PromiseStatus {
    public promise: Promise<void>;
    public resolve!: (value: void | PromiseLike<void>) => void;
    public reject!: (reason?: any) => void;
    public status: 'unsettled' | 'resolved' | 'rejected';

    constructor() {
        this.status = 'unsettled';
        this.promise = this.createNewPromise();
    }

    private createNewPromise() {
        return new Promise<void>((resolve, reject) => {
            this.resolve = (value) => {
                if (this.status !== 'unsettled') return;
                this.status = 'resolved';
                resolve(value);
            };
            this.reject = (reason?) => {
                this.status = 'rejected';
                reject(reason);
            };
        });
    }

    get isSettled() {
        return this.status !== 'unsettled';
    }

    get isResolved() {
        return this.status === 'resolved';
    }

    get isRejected() {
        return this.status === 'rejected';
    }

    reset() {
        this.promise = this.createNewPromise();
        this.status = 'unsettled';
    }

    then<TResult1 = void, TResult2 = never>(
        onfulfilled?:
            | ((value: void) => TResult1 | PromiseLike<TResult1>)
            | undefined
            | null,
        onrejected?:
            | ((reason: any) => TResult2 | PromiseLike<TResult2>)
            | undefined
            | null,
    ): Promise<TResult1 | TResult2> {
        return this.promise.then(onfulfilled, onrejected);
    }

    catch<TResult = never>(
        onrejected?:
            | ((reason: any) => TResult | PromiseLike<TResult>)
            | undefined
            | null,
    ): Promise<void | TResult> {
        return this.promise.catch(onrejected);
    }

    finally(onfinally?: (() => void) | undefined | null): Promise<void> {
        return this.promise.finally(onfinally);
    }
}
