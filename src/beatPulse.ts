import { useFMOD } from "./FMODProvider";

const easeInOutQuad = (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

let beatPulseID: number;

// Some kind of ChatGPT hellscape nightmare
const beatPulseInterpolate = (
    start: number,
    end: number,
    duration: number,
) => new Promise<void> ((resolve) => {
        const startTime = performance.now();

        const callUpdate = (currentTime: number): void => {
            const elapsed = currentTime - startTime;
            const progress = easeInOutQuad(Math.min(elapsed / duration, 1));
            const value = start + (end - start) * progress + '%';
            document.documentElement.style.setProperty('--beat-pulse', value);
            if (progress < 1) {
                beatPulseID = requestAnimationFrame(callUpdate);
            } else {
                resolve();
            }
        };
        beatPulseID = requestAnimationFrame(callUpdate);
    });

export async function beatPulse() {
    await beatPulseInterpolate(0, 100, 200);
    await beatPulseInterpolate(100, 0, 600);
};
