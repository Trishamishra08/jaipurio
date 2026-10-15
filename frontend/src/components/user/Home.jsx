import React from 'react';
import HeroCarousel from './HeroCarousel';
import FeaturesBar from './FeaturesBar';
import Categories from './Categories';
import HomeAfterCategory from './HomeAfterCategory';
import NewArrivalBanner from './NewArrivalBanner';
import BestSellers from './BestSellers';
import CategoryProducts from './CategoryProducts';
import CouponOffers from './CouponOffers';
import TrustFooterStrip from './TrustFooterStrip';
import WhyChooseJaipurio from './WhyChooseJaipurio';
import Testimonials from './Testimonials';
import { useHomeSections } from '../../utils/useHomeSections';

// Everything below the hero is rendered in the order set in
// Admin → Appearance → Home Page (each part hides itself when switched off).
const PARTS = {
  featuresBar: FeaturesBar,
  shopByCategory: Categories,
  mainBlock: HomeAfterCategory,
  newArrival: NewArrivalBanner,
  popular: BestSellers,
  categoryRails: CategoryProducts,
  coupons: CouponOffers,
  trustStrip: TrustFooterStrip,
  whyChoose: WhyChooseJaipurio,
  testimonials: Testimonials,
};

const Home = () => {
  const home = useHomeSections();

  return (
    <div className="relative min-h-screen bg-white pb-16 md:pb-8 overflow-x-hidden w-full">
      {home.sections.hero.enabled && <HeroCarousel />}

      <div className="relative z-10 pt-1">
        {home.pageOrder.map((key) => {
          const Part = PARTS[key];
          return Part ? <Part key={key} /> : null;
        })}
      </div>
    </div>
  );
};

export default Home;
