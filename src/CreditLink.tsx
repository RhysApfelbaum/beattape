import React, { ReactNode } from 'react';

interface Contributor {
    name: string;
    link: string;
}

export const Link: React.FC<{ href: string, text: string }> = ({ href, text }) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="

        underline
        text-base04

        hover:text-base05 transition-all
        "
    >
        {text}
    </a>
)


const CreditLink: React.FC<{ contributor: Contributor }> = ({
    contributor,
}) => <Link href={contributor.link} text={contributor.name} />;

export default CreditLink;
