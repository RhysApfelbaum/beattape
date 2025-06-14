import React from 'react';

const Button: React.FC<React.ComponentPropsWithoutRef<'button'>> = ({
    className,
    ...props
}) => {
    return (
        <button
            className={`
                rounded-[3px]
                flex justify-center items-center
                shadow-[5px_5px_var(--color-base04)]
                bg-base07
                transition-all
                active:shadow-[2px_2px_base04]
                active:brightness-50
                active:translate-x-[3px] active:translate-y-[3px]
                ${className ?? ''}
            `}
            {...props}
        />
    );
};

export default Button;
