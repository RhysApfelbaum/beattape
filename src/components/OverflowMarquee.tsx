import { motion, useAnimationControls } from 'framer-motion';
import { useLayoutEffect, useRef } from 'react';

interface OverflowMarqueeProps {
    children: React.ReactNode;
    speed?: number; // pixels per second
    pause?: number; // seconds to pause at end
}

const OverflowMarquee: React.FC<OverflowMarqueeProps> = ({
    children,
    speed = 25,
    pause = 1,
}) => {
    const controls = useAnimationControls();
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!ref.current) return;

        const scrollWidth = ref.current.scrollWidth;
        const parentWidth = ref.current.parentElement?.offsetWidth || 0;
        const scrollDistance = scrollWidth - parentWidth;

        controls.stop();
        controls.set({ x: 0 });
        if (scrollDistance <= 0) {
            return;
        }

        const duration = scrollDistance / speed; // seconds


        controls.start({
            x: [0, -scrollDistance],
            transition: {
                duration,
                ease: 'linear',
                repeat: Infinity,
                repeatDelay: pause,
            },
        });
    }, [children, speed, pause]);

    return (
        <div className="overflow-hidden whitespace-nowrap w-full">
            <motion.div ref={ref} animate={controls}>
                {children}
            </motion.div>
        </div>
    );
};

export default OverflowMarquee;
