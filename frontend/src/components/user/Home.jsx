import React from 'react';
import HeroCarousel from './HeroCarousel';
import FeaturesBar from './FeaturesBar';
import Categories from './Categories';
import TrendingOffers from './TrendingOffers';
import BestSellers from './BestSellers';
import TrustFooterStrip from './TrustFooterStrip';
import WhyChooseJaipurio from './WhyChooseJaipurio';
import Testimonials from './Testimonials';

const Home = () => {
  return (
    <div className="relative min-h-screen bg-white pb-12 md:pb-8 overflow-x-hidden w-full">
      <HeroCarousel />

      <div className="relative z-10 pt-1">
        <FeaturesBar />
        <Categories />
        <TrendingOffers />
        <BestSellers />
        <TrustFooterStrip />
        <WhyChooseJaipurio />
        <Testimonials />
      </div>
    </div>
  );
};

export default Home;
