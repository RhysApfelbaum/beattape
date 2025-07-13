import { PromiseStatus } from './promiseStatus';

// Shared gesture PromiseStatus
export const gesture = new PromiseStatus();

const gestureListeners: (() => void)[] = [];

export function onUserGesture(callback: () => void) {
    if (gesture.isResolved) {
        callback();
    } else {
        gestureListeners.push(callback);
    }
}

// Setup once: listen for gestures, resolve gesture and call queued callbacks immediately
['click', 'touchstart', 'keydown'].forEach((eventType) => {
    document.addEventListener(
        eventType,
        (e) => {
            if (!gesture.isResolved) {
                gesture.resolve();

                // Run all queued callbacks synchronously inside the gesture event!
                gestureListeners.forEach((cb) => cb());
                gestureListeners.length = 0; // clear queue
            }
        },
        { once: true },
    );
});
