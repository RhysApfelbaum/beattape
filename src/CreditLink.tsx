import React from 'react';

interface Contributor {
    name: string;
    link: string;
}

const CreditLink: React.FC<{ contributor: Contributor }> = ({
    contributor,
}) => (
    <a
        href={contributor.link}
        target="_blank"
        rel="noreferrer noopener"
        className="

        underline
        text-base04

        hover:text-base05 transition-all
        "
    >
        {contributor.name}
    </a>
);

export default CreditLink;
