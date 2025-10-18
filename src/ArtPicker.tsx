import React, { SetStateAction, useEffect, useState } from 'react';
import contributors from './contributors.json';
import artData from './art.json';

import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import Modal from './Modal';
import { useIsMobile } from './fmod/helpers';
import Palette from './Palette';
import { theme, themes } from './styles/theme';

type Contributor = typeof contributors.soundtomb;

const ArtPicker: React.FC<{
    artist: string;
    index: number;
    setIndex: React.Dispatch<SetStateAction<number>>;
}> = ({ artist, index, setIndex }) => {
    const [open, setOpen] = useState(false);
    const artistInfo = contributors[artist as keyof typeof contributors];
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const mobile = useIsMobile(1000);

    const preloadImages = async () => {
        const promises = artData.map((art) => {
            return new Promise<void>((resolve) => {
                const img = new Image();
                img.src = art.thumbnailUrl;
                img.onload = () => resolve();
            });
        });
        await Promise.all(promises);
        setImagesLoaded(true);
    };

    useEffect(() => {
        preloadImages();
    }, []);

    const handleSelect = (idx: number) => {
        setIndex(idx);
        setOpen(false);
    };

    return (
        <>
            {!open && (
                <button
                    className="
                    rounded-[3px]
                    cursor-pointer
                    flex gap-1 items-center
                    transition-all
                    hover:animate-pulse
                    pl-5
                    group
                    "
                    title="Change artwork"
                    onClick={() => setOpen(true)}
                >
                    <div className="bg-base0A w-3 h-3 rounded group-hover:bg-base09 transition-all" />
                    <div className="bg-base05 w-3 h-3 rounded group-hover:bg-base06 transition-all" />
                    <div className="bg-base0F w-3 h-3 rounded group-hover:bg-base0E transition-all" />
                </button>
            )}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
            >
                <section className="flex flex-col items-center">
                    <h2>Select Artwork</h2>
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={mobile ? 'auto' : 5 }
                        navigation
                        className="px-10"
                        onSlideChange={(swiper) => {
                            if (mobile) {
                                setIndex(swiper.activeIndex);
                            }
                        }}
                        onSwiper={(swiper) => {
                            if (mobile) {
                                swiper.slideTo(index);
                            }
                        }}
                    >
                        {artData.map((art, index) => (
                            <SwiperSlide key={index}>
                                <div className="flex justify-center">
                                    <button
                                        className="
                                        bg-transparent
                                        border-0
                                        text-inherit
                                        font-inherit
                                        p-[2px]
                                        rounded-lg
                                        flex flex-col
                                        self-center
                                        transition-colors
                                        duration-300 ease-in-out
                                        hover:bg-base0A
                                        hover:text-darkTint
                                        hover:font-bold
                                        "
                                        onClick={() => handleSelect(index)}
                                    >
                                        <img
                                            className="
                                            rounded-lg
                                            "
                                            src={art.thumbnailUrl}
                                        />
                                    </button>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <label htmlFor="theme-select">Theme</label>
                    <select id="theme-select">
                        {
                            Object.entries(themes).map(([name, theme]) =>
                                <option value={name}>
                                    {theme.displayName}
                                </option>
                            )
                        }
                    </select>
                    <div className="grid grid-cols-4 w-fit">
                        {
                            Object.keys(theme).map(key =>
                                <button
                                    key={key}
                                    className="w-8 h-8 rounded border m-1"
                                    style={{
                                        backgroundColor: theme[key as keyof typeof theme]
                                    }}
                                >
                                </button>
                            )
                        }
                    </div>
                </section>
            </Modal>
        </>
    );
};

export default ArtPicker;
