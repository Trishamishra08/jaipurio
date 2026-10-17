import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { initialProducts, initialCategories, initialOffers, initialVendors, initialReviews } from '../data/products';
import api from '../utils/api';
import { mapApiProductToStorefront } from '../utils/storefrontProduct';
import { isLegacyDemoSession } from '../utils/customerAuth';
import { captureReferralFromUrl } from '../utils/referralTracking';

const ShopContext = createContext();

// `catalog` is now a bounded "bootstrap" sample (see refreshProducts), not the
// full product collection, so a cart item can be legitimately missing from it
// without being unavailable. Resolve anything missing by id before deciding an
// item is actually gone — otherwise items outside the sample would silently
// vanish from the customer's cart on every reload.
const syncCartWithCatalog = async (items, catalog) => {
  if (!Array.isArray(items) || !items.length) return items || [];
  const byId = new Map((catalog || []).map((p) => [String(p._id), p]));
  const missingIds = items.map((item) => String(item._id)).filter((id) => !byId.has(id));

  let lookupFailed = false;
  if (missingIds.length) {
    try {
      const res = await api.get('/products', { params: { ids: missingIds.join(',') } });
      (res.data?.data?.products || [])
        .map(mapApiProductToStorefront)
        .filter(Boolean)
        .forEach((p) => byId.set(String(p._id), p));
    } catch {
      lookupFailed = true;
    }
  }

  return items
    .map((item) => {
      const fresh = byId.get(String(item._id));
      if (fresh) {
        return {
          ...item,
          name: fresh.name,
          price: fresh.price,
          oldPrice: fresh.oldPrice,
          image: fresh.image || fresh.iconImage,
          vendor: fresh.vendor,
          category: fresh.category,
        };
      }
      // Confirmed gone by the server (deleted/unpublished) => drop it. If the
      // lookup itself failed (network blip), keep the item rather than risk
      // losing real cart data.
      return lookupFailed ? item : null;
    })
    .filter(Boolean);
};

export const useShop = () => {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return ctx;
};

export const ShopProvider = ({ children, loadCatalog = true }) => {
  const [products, setProducts] = useState(initialProducts);
  const [productsLoading, setProductsLoading] = useState(true);

  // One-time, app-wide: pick up ?ref=<code> on any page load (not just the
  // homepage — a shared product link can carry it too) and store it for the
  // 30-day attribution window. Checkout reads it back when placing an order.
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      // Bounded bootstrap sample for homepage widgets/cart-price-refresh — the
      // full catalog (thousands of products after the data migration) is no
      // longer fetched in one shot; Shop.jsx paginates the real browse/search
      // directly against the backend instead of reading from this array.
      const res = await api.get('/products', { params: { limit: 100, sort: 'popular' } });
      const list = res.data?.data?.products;
      if (Array.isArray(list) && list.length > 0) {
        setProducts(list.map(mapApiProductToStorefront).filter(Boolean));
      }
    } catch {
      /* keep demo catalog if API unavailable */
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadCatalog) {
      setProductsLoading(false);
      return;
    }
    refreshProducts();
  }, [loadCatalog, refreshProducts]);

  const [categories, setCategories] = useState(initialCategories);
  const [offers, setOffers] = useState(initialOffers);
  const [vendors, setVendors] = useState(initialVendors);
  const [reviews, setReviews] = useState(initialReviews);

  const [banners, setBanners] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  const refreshBanners = useCallback(async () => {
    setBannersLoading(true);
    try {
      const res = await api.get('/banners');
      const list = res.data?.data?.banners;
      setBanners(Array.isArray(list) ? list : []);
    } catch {
      /* keep previous banners if the API is unavailable */
    } finally {
      setBannersLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBanners();
  }, [refreshBanners]);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('jaipurio_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('jaipurio_wishlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  // When each wishlist item was saved (id → ISO time), so the wishlist can show "Added today" vs "Saved earlier".
  const [wishlistAddedAt, setWishlistAddedAt] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('jaipurio_wishlist_dates') || '{}') || {};
    } catch {
      return {};
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('jaipurio_auth') === '1';
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('jaipurio_user');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return {
      name: 'Demo User',
      gender: 'Female',
      email: 'demo@jaipurio.com',
      mobile: '8839044030',
      phone: '8839044030',
      address: 'Johari Bazaar, Jaipur, Rajasthan 302003',
    };
  });

  /* Sessions from the old shared demo login are signed out — customers now log in with their own number. */
  useEffect(() => {
    if (!isLegacyDemoSession()) return;
    try {
      localStorage.removeItem('jaipurio_auth');
      localStorage.removeItem('jaipurio_user');
      localStorage.removeItem('customer_token');
    } catch {
      /* ignore */
    }
    setIsAuthenticated(false);
  }, []);

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('jaipurio_location');
      if (saved) return JSON.parse(saved);
    } catch {
      /* ignore */
    }
    return {
      label: 'Jaipur, Rajasthan',
      address: 'Johari Bazaar, Jaipur, Rajasthan 302003',
      lat: 26.9124,
      lng: 75.7873,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('jaipurio_location', JSON.stringify(deliveryLocation));
    } catch {
      /* ignore */
    }
  }, [deliveryLocation]);

  const [flyingItems, setFlyingItems] = useState([]);

  const cartRef = useRef(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    let cancelled = false;
    syncCartWithCatalog(cartRef.current, products).then((next) => {
      if (!cancelled) setCart(next);
    });
    return () => {
      cancelled = true;
    };
  }, [products, productsLoading]);

  useEffect(() => {
    try {
      localStorage.setItem('jaipurio_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('jaipurio_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  useEffect(() => {
    try {
      localStorage.setItem('jaipurio_wishlist_dates', JSON.stringify(wishlistAddedAt));
    } catch (e) {}
  }, [wishlistAddedAt]);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const wishlistCount = wishlist.length;

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item._id === product._id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    const id = String(productId);
    setCart((prev) => prev.filter((item) => String(item._id ?? item.id) !== id));
  };

  const updateQuantity = (productId, delta) => {
    const id = String(productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (String(item._id ?? item.id) !== id) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean)
    );
  };

  const toggleWishlist = (product) => {
    const id = product._id || product;
    const removing = wishlist.includes(id);
    setWishlist((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    setWishlistAddedAt((prev) => {
      const next = { ...prev };
      if (removing) delete next[id];
      else next[id] = new Date().toISOString();
      return next;
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  const clearCart = () => setCart([]);

  // Vendor Functions
  const addProduct = (newProd) => {
    const prod = {
      ...newProd,
      _id: `mitti-prod-${Date.now()}`,
      rating: 5.0,
      reviews: 0
    };
    setProducts(prev => [prod, ...prev]);
  };

  const deleteProduct = (prodId) => {
    setProducts(prev => prev.filter(p => p._id !== prodId));
  };

  const updateProduct = (prodId, updatedFields) => {
    setProducts(prev => prev.map(p => p._id === prodId ? { ...p, ...updatedFields } : p));
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        offers,
        vendors,
        reviews,
        banners,
        bannersLoading,
        refreshBanners,
        cart,
        cartCount,
        cartTotal,
        wishlist,
        wishlistCount,
        wishlistAddedAt,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        deliveryLocation,
        setDeliveryLocation,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
        addProduct,
        deleteProduct,
        updateProduct,
        logout: () => {
          localStorage.removeItem('jaipurio_auth');
          localStorage.removeItem('jaipurio_user');
          localStorage.removeItem('customer_token');
          setIsAuthenticated(false);
        },
        fetchData: refreshProducts,
        refreshProducts,
        setCategories,
        loading: productsLoading
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};
