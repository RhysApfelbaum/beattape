import { useEffect, useState } from 'react';

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
