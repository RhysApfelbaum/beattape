import React, { useState } from "react";
import { Controller, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from 'swiper/react';
import TrackSliders from "./TrackSliders";

import AmbienceSliders from "./AmbienceSliders";
import Effects from "./Effects";

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
                height={200}
            >
                <SwiperSlide>
                    <p>Track Sliders</p>
                </SwiperSlide>
                <SwiperSlide>
                    <p>Ambience Sliders</p>
                </SwiperSlide>
                <SwiperSlide>
                    <p>Effects</p>
                </SwiperSlide>
            </Swiper>
            <Swiper
                modules={[Navigation, Controller]}
                slidesPerView="auto"
                navigation
                centeredSlides={true}
                controller={{ control: headerSwiper }}
                onSwiper={setMainSwiper}
            >
                <SwiperSlide>
                        <TrackSliders />
                </SwiperSlide>
                <SwiperSlide>
                        <AmbienceSliders />
                </SwiperSlide>
                <SwiperSlide>
                        <Effects />
                </SwiperSlide>
            </Swiper>
        </div>
    );
}

export default SliderSwiper;
