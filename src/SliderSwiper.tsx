import React, { useState } from "react";
import { Controller, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from 'swiper/react';
import TrackSliders from "./TrackSliders";

import 'swiper/css';

const SliderSwiper: React.FC = () => {
    const [headerSwiper, setHeaderSwiper] = useState<any>(null);
    const [mainSwiper, setMainSwiper] = useState<any>(null);
    return (
        <div className="w-100">
            <Swiper
                slidesPerView="auto"
                onSwiper={setHeaderSwiper}
                modules={[ Controller ]}
                controller={{ control: mainSwiper }}
            >
                <SwiperSlide>
                    <p>Track Sliders</p>
                </SwiperSlide>
                <SwiperSlide>
                    <p>Track Sliders</p>
                </SwiperSlide>
                <SwiperSlide>
                    <p>Track Sliders</p>
                </SwiperSlide>
            </Swiper>
            <Swiper
                modules={[Navigation, Controller]}
                slidesPerView="auto"
                navigation
                autoHeight={true}
                centeredSlides={true}
                controller={{ control: headerSwiper }}
                onSwiper={setMainSwiper}
            >
                <SwiperSlide>
                    <TrackSliders />
                </SwiperSlide>
                <SwiperSlide>
                    <TrackSliders />
                </SwiperSlide>
                <SwiperSlide>
                    <TrackSliders />
                </SwiperSlide>
            </Swiper>
        </div>
    );
}

export default SliderSwiper;
