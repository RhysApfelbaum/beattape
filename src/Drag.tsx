import React, { useRef, useEffect, ReactNode } from 'react';

export type PositionUpdater = (position: { x: number; y: number }) => void;

const Drag: React.FC<{
    onPositionUpdate: PositionUpdater;
    children: ReactNode;
}> = ({ onPositionUpdate, children }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const element = elementRef.current;

        if (!element) return;

        positionRef.current = {
            x: window.innerWidth / 2,
            y: window.innerHeight * 0.7,
        };

        // Set the correct position when the component first loads
        onPositionUpdate({
            x: window.innerWidth / 2 - positionRef.current.x,
            y: window.innerHeight / 2 - positionRef.current.y,
        });

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const movePosition = (x: number, y: number) => {
            positionRef.current = {
                x: positionRef.current.x + x,
                y: positionRef.current.y + y,
            };
            setPosition();
            onPositionUpdate({
                x: window.innerWidth / 2 - positionRef.current.x,
                y: window.innerHeight / 2 - positionRef.current.y,
            });

        }

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const viewportX = touch.clientX;
            const viewportY = touch.clientY;

            // Update positionRef.current to absolute viewport coords
            positionRef.current = {
                x: viewportX,
                y: viewportY,
            };

            element.style.left = `${viewportX}px`;
            element.style.top = `${viewportY}px`;

            // Notify parent with position relative to center of viewport
            onPositionUpdate({
                x: window.innerWidth / 2 - viewportX,
                y: window.innerHeight / 2 - viewportY,
            });
        };

        const setPosition = () => {
            const { x, y } = positionRef.current;

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        };

        setPosition();

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };

        const handleMouseMove = (e: MouseEvent) => {
            movePosition(e.movementX, e.movementY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touch = e.touches[0];
            const viewportX = touch.clientX;
            const viewportY = touch.clientY;

            // Update positionRef.current to absolute viewport coords
            positionRef.current = {
                x: viewportX,
                y: viewportY,
            };

            element.style.left = `${viewportX}px`;
            element.style.top = `${viewportY}px`;

            // Notify parent with position relative to center of viewport
            onPositionUpdate({
                x: window.innerWidth / 2 - viewportX,
                y: window.innerHeight / 2 - viewportY,
            });
        };

        const setPosition = () => {
            const { x, y } = positionRef.current;

            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        };

        setPosition();

        const handleTouchStart = (e: TouchEvent) => {
            e.preventDefault();
            document.addEventListener('touchmove', handleTouchMove, {
                passive: false,
            });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchEnd);
        };

        const handleTouchEnd = () => {
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            document.removeEventListener('touchcancel', handleTouchEnd);
        };

        const handleMouseMove = (e: MouseEvent) => {
            movePosition(e.movementX, e.movementY);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('touchstart', handleTouchStart);

        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
        };
    }, [onPositionUpdate]);


    return (
        <div>
            <div
                ref={elementRef}
                style={{
                    position: 'fixed',
                    cursor: 'move',
                    zIndex: 50,
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default Drag;
