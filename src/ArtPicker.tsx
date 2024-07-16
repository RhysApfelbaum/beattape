import React, { SetStateAction, useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import contributors from './contributors.json';
import artData from './art.json';

import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

type Contributor = typeof contributors.soundtomb;

const ArtPickerBox = styled.div`
    border: 1px solid ${props => props.theme.colors.brightLight};
    border-radius: 5px;
    padding: 10px;
    background-color: ${props => props.theme.colors.background};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    width: 50%;

    .swiper-button-prev, .swiper-button-next {
        color: ${props => props.theme.colors.brightLight};
    }
`;

const Blur = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    z-index: 99;
    transition: fade in;
`;

const ArtThumbnail = styled.img`
    border-radius: 10px;
    border: 1px solid ${props => props.theme.colors.brightLight};
`;

const ArtSelector = styled.button`
    background: none;
    border: none;
    color: inherit;
    font: inherit;
    padding: 10px;
    border-radius: 10px;
    transition: background 0.3s ease;
    display: flex;
    flex-direction: column;
    align-self: center;

    &:hover {
        background-color: ${props => props.theme.colors.brightLight};
        color: ${props => props.theme.colors.darkTint};
        font-weight: bolder;
    }
`;

const ArtPicker: React.FC<{
    artist: string
    setArtIndex: React.Dispatch<SetStateAction<number>>,
    handleClose: () => void
}> = ({ artist, setArtIndex, handleClose }) => {
    const theme = useTheme();

    const artistInfo = contributors[artist as keyof typeof contributors];
    const [imagesLoaded, setImagesLoaded] = useState(false);

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

    const handleSelect = (index: number) => {
        setArtIndex(index);
        handleClose();
    };

    return (
        <>
            <ArtPickerBox>
                <h2>Select Artwork</h2>
                <Swiper
                    modules={[Scrollbar, Navigation]}
                    slidesPerView={3}
                    spaceBetween={20}
                    navigation
                >
                    {
                        artData.map((art, index) => (
                            <SwiperSlide key={index} style={{
                                marginBottom: 10
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center'
                                }}>
                                    <ArtSelector onClick={() => handleSelect(index)}>
                                        <ArtThumbnail src={art.thumbnailUrl}/>
                                    </ArtSelector>
                                </div>
                            </SwiperSlide>
                        ))
                    }
                </Swiper>
            </ArtPickerBox>
            <Blur onClick={handleClose}/>
        </>
    );
};

export default ArtPicker;
