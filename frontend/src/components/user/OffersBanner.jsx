import { useShop } from '../../context/ShopContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// Removed local import of offersVideo to fix cache error by using public folder directly
const offersVideo = '/offers_video.mp4';


const OffersBanner = () => {
  const { banners } = useShop();
  const offer = banners.find(b => b.type === 'Offer' || b.type === 'Offers') || banners.find(b => b.type === 'Main Slider') || banners[0];

  // We always want to show the video if it exists locally, regardless of backend banners
  if (!offer && !offersVideo) return null;

  const displayOffer = offer || {
    title: "Exclusive Divine Offers",
    subtitle: "Limited Time Access",
    link: "/shop",
    btnText: "Explore Collection"
  };

  const isVideo = offer ? (offer.image?.match(/\.(mp4|webm|ogg)$/i) || offer.video || offer.isVideo) : false;

  return (
    <section className="py-12 md:py-20 bg-brand-pink/10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative rounded-none overflow-hidden h-[400px] md:h-[450px] shadow-2xl group">
          {offersVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
            >
              <source src={offersVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : isVideo ? (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="none"
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
            >
              <source src={offer.video || offer.image} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={offer.image}
              alt={offer.title}
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-105"
            />
          )}

          {/* Enhanced Overlay for premium feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent md:bg-gradient-to-r md:from-black/20 md:to-transparent flex items-center">
            <div className="p-8 md:p-20 text-white max-w-xl text-center md:text-left mx-auto md:mx-0">
              <span className="bg-brand-gold text-white px-5 py-1.5 rounded-none text-[10px] sm:text-xs font-bold mb-4 sm:mb-6 inline-block tracking-[0.2em] uppercase shadow-lg shadow-brand-gold/20">
                {displayOffer.subtitle}
              </span>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold mb-4 sm:mb-6 italic leading-tight drop-shadow-md">
                  {displayOffer.title}
                </h2>
              </motion.div>
              <Link to={displayOffer.link} className="bg-white text-brand-dark hover:bg-brand-gold hover:text-white px-5 py-2 sm:px-6 sm:py-2.5 rounded-none text-xs sm:text-sm font-bold transition-all transform hover:-translate-y-1 active:translate-y-0 duration-300 shadow-xl inline-flex items-center justify-center gap-2 group/btn">
                <span>{displayOffer.btnText}</span>
                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Subtle floral accent or border */}
          <div className="absolute inset-0 border-[10px] border-white/10 pointer-events-none rounded-none"></div>
        </div>
      </div>
    </section>
  );
};

export default OffersBanner;
