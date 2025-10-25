import React, { useState } from 'react';

import artData from './art.json';
import ArtPicker from './ArtPicker';
import CreditLink from './CreditLink';
import contributors from './contributors.json';
import Info from './Info';
import { useTheme } from './ThemeProvider';

const Art: React.FC = () => {
    const { art } = useTheme();

    return (
        <section className="py-5 mb-10">
            <img
                src={art.url}
                className="w-80 md:w-auto md:max-h-80 rounded border-3 border-[color-mix(in_srgb,var(--color-base03),var(--color-base09)_var(--beat-pulse))]"
            />
            <div className="flex justify-between items-center mt-3">
                <div className="flex gap-2 justify-center">
                    <p className="text-base04">Artwork by</p>
                    <CreditLink
                        contributor={
                            contributors[art.artist as keyof typeof contributors]
                        }
                    />
                </div>
                <div className="flex">
                    <Info />
                    <ArtPicker />
                </div>
            </div>
        </section>
    );
};

export default Art;
