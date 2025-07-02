import React, { useState } from "react";

import artData from './art.json';
import ArtPicker from "./ArtPicker";

const Art: React.FC = () => {

    const [artIndex, setArtIndex] = useState(
        Math.floor(Math.random() * (Object.keys(artData).length - 2))
    );

    const art = artData[artIndex];

    return (
        <section className="p-5 mb-10">
            <img
                src={art.url}
                className='w-80 md:w-auto rounded border-3 border-[color-mix(in_srgb,var(--color-base03),var(--color-base09)_var(--beat-pulse))]'
            />
            <ArtPicker artist={art.artist} index={artIndex} setIndex={setArtIndex} />
        </section>
    );
};

export default Art;
