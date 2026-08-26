import React from 'react';
import HeroCarousel from './HeroCarousel';
import FeaturesBar from './FeaturesBar';
import Categories from './Categories';
import HomeAfterCategory from './HomeAfterCategory';
import NewArrivalBanner from './NewArrivalBanner';
import BestSellers from './BestSellers';
import CouponOffers from './CouponOffers';
import TrustFooterStrip from './TrustFooterStrip';
import WhyChooseJaipurio from './WhyChooseJaipurio';
import Testimonials from './Testimonials';

const Home = () => {
  return (
    <div className="relative min-h-screen bg-white pb-16 md:pb-8 overflow-x-hidden w-full">
      <HeroCarousel />

      <div className="relative z-10 pt-1">
        <FeaturesBar />
        <Categories />
        <HomeAfterCategory />
        <NewArrivalBanner />
        <BestSellers />
        <CouponOffers />
        <TrustFooterStrip />
        <WhyChooseJaipurio />
        <Testimonials />
      </div>
    </div>
  );
};

export default Home;
