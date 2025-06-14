import React from "react";

interface Contributor {
    name: string;
    link: string;
}

const CreditLink: React.FC<{ contributor: Contributor }> = ({ contributor }) => (
    <a
        href={contributor.link}
        target="_blank"
        rel="noreferrer noopener"
        className="hover:underline transition-all"
    >
        { contributor.name }
    </a>
);

export default CreditLink;
