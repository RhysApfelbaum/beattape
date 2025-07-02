import React, { SetStateAction, useEffect, useState } from 'react';
import contributors from './contributors.json';
import artData from './art.json';

import { Navigation, Scrollbar } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import Modal from './Modal';
import Button from './Button';
import { useIsMobile } from './fmod/helpers';

type Contributor = typeof contributors.soundtomb;

const ArtPicker: React.FC<{
    artist: string
    index: number,
    setIndex: React.Dispatch<SetStateAction<number>>
}> = ({ artist, index, setIndex }) => {

    const [ open, setOpen ] = useState(false);
    const artistInfo = contributors[artist as keyof typeof contributors];
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const mobile = useIsMobile();

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
            <Button onClick={() => setOpen(true)}>Change artwork</Button>
            <Modal open={open} onClose={() => setOpen(false)}>
                <h2>Select Artwork</h2>
                <Swiper
                    modules={[Navigation]}
                    slidesPerView={mobile ? 1 : 5}
                    navigation
                    className="px-10"
                    onSlideChange={swiper => {
                        if (mobile) {
                            setIndex(swiper.activeIndex);
                        }
                    }}
                    onSwiper={swiper => {
                        if (mobile) {
                            swiper.slideTo(index)
                        }
                    }}
                >
                    {
                        artData.map((art, index) => (
                            <SwiperSlide key={index}>
                                <div className="flex justify-center">
                                    <button className="
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
                                        <img className="
                                            rounded-lg
                                            border
                                            border-brightLight
                                            "
                                            src={art.thumbnailUrl}
                                        />
                                    </button>
                                </div>
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
            </Modal>
        </>
    );
};

export default ArtPicker;
