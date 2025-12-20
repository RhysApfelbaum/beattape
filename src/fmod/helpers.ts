import { useEffect, useState } from 'react';

import loggingJSON from '../logging.json';


const devMode = process.env.NODE_ENV === 'development';
export const logging: typeof loggingJSON = {
    debug: loggingJSON.debug && devMode,
    fmodstudio: loggingJSON.fmodstudio && devMode
};


export function assertNotNull<T>(
    value: T,
    message = 'Failed non-null assertion',
): asserts value is NonNullable<T> {
    if (value === null) {
        throw new Error(message);
    }
}

export function unreachable(): never {
    throw new Error('This code should be unreachable');
}

export function assertEqual<T>(a: T, b: T) {
    if (a !== b) {
        throw new Error(`Failed equality assertion: ${a}, ${b}`);
    }
}

export const useIsMobile = (breakpoint: number = 768) => {
    const [isMobile, setIsMobile] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < breakpoint : false,
    );

    useEffect(() => {
        const handler = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [breakpoint]);

    return isMobile;
};

export const resolveOnAbort = (signal: AbortSignal) => new Promise<void>(resolve => {
    if (signal.aborted) {
        resolve();
    } else {
        signal.addEventListener('abort', _ => void resolve(), { once: true })
    }
});



export const dbg = (message: any, ...optionalParams: any[]) => {
    if (logging.debug) {
        console.debug(message, ...optionalParams);
    }
}
