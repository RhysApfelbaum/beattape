import React, { useState } from "react";


const Modal: React.FC<{
    open: boolean,
    onClose: () => void,
    children: React.ReactNode
}> = ({ open, onClose, children }) => {

    if (!open)
        return null;

    return (
        <div>
            <div className="
                border border-brightLight
                rounded-md
                p-2.5
                bg-base00
                fixed
                top-1/2 left-1/2
                -translate-x-1/2 -translate-y-1/2
                z-100
                max-w-[80%]
                "
            >
                { children }
            </div>

            <button className="
                fixed
                inset-0
                z-[99]
                "
                style={{
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba( 0, 0, 0, 0.2 )'
                }}
                onClick={onClose}
            />
        </div>
    )
}

export default Modal;
