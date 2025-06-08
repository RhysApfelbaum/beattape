import { PromiseStatus } from "./promiseStatus";

export const gesture = new PromiseStatus();

const gestures = [
    'click',
    'touchstart',
    'keydown'
];
gestures.forEach(eventType =>
    document.addEventListener(eventType, () => gesture.resolve(), { once: true })
);
