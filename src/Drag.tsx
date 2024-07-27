import React, { useRef, useEffect, ReactNode } from 'react';

export type PositionUpdater = (position: { x: number; y: number }) => void;

const Drag: React.FC<{
    onPositionUpdate: PositionUpdater,
    children: ReactNode
}> = ({ onPositionUpdate, children }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const element = elementRef.current;

        if (!element) return;

        
        const rect = element.getBoundingClientRect();

        positionRef.current = {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        }

        // Set the correct position when the component first loads
        onPositionUpdate({
            x: window.innerWidth / 2 - positionRef.current.x,
            y: window.innerHeight / 2 - positionRef.current.y
        });

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleMouseMove = (e: MouseEvent) => {
            positionRef.current = {
                x: positionRef.current.x + e.movementX,
                y: positionRef.current.y + e.movementY,
            };
            element.style.transform = `translate(${positionRef.current.x - rect.x}px, ${positionRef.current.y - rect.y}px)`;
            onPositionUpdate({
                x: window.innerWidth / 2 - positionRef.current.x,
                y: window.innerHeight / 2 - positionRef.current.y
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        element.addEventListener('mousedown', handleMouseDown);


        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
        };
    }, [onPositionUpdate]);

    return (
        <div>
            <div ref={elementRef} style={{ position: 'absolute', cursor: 'move'}}>
                {children}
            </div>
        </div>
    );
};

export default Drag;
