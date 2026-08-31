import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { initialProducts, initialCategories, initialOffers, initialVendors, initialReviews } from '../data/products';
import { PHOTOS } from '../data/photos';
import api from '../utils/api';
import { mapApiProductToStorefront } from '../utils/storefrontProduct';
import { ensureCustomerAuth, isDemoToken } from '../utils/customerAuth';

const ShopContext = createContext();

const syncCartWithCatalog = (items, catalog) => {
  if (!Array.isArray(items) || !catalog?.length) return items || [];
  const byId = new Map(catalog.map((p) => [String(p._id), p]));
  return items
    .map((item) => {
      const fresh = byId.get(String(item._id));
      if (!fresh) return null;
      return {
        ...item,
        name: fresh.name,
        price: fresh.price,
        oldPrice: fresh.oldPrice,
        image: fresh.image || fresh.iconImage,
        vendor: fresh.vendor,
        category: fresh.category,
      };
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

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await api.get('/products');
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

  /* Upgrade legacy demo-token sessions to real API JWT */
  useEffect(() => {
    if (!isAuthenticated && !isDemoToken()) return;
    if (isDemoToken() || (isAuthenticated && !localStorage.getItem('customer_token'))) {
      ensureCustomerAuth().then((token) => {
        if (!token) return;
        try {
          const saved = localStorage.getItem('jaipurio_user');
          if (saved) setUser(JSON.parse(saved));
        } catch {
          /* ignore */
        }
      });
    }
  }, [isAuthenticated]);

  const [categories, setCategories] = useState(initialCategories);
  const [offers, setOffers] = useState(initialOffers);
  const [vendors, setVendors] = useState(initialVendors);
  const [reviews, setReviews] = useState(initialReviews);

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
    return ['mitti-prod-1', 'mitti-prod-4'];
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

  const [orders, setOrders] = useState([
    {
      id: 'ORD-JM-8921',
      date: '2026-08-19',
      status: 'In Transit',
      total: 897,
      items: [
        {
          name: 'Rajasthani Design Matka (5L)',
          price: 399,
          quantity: 1,
          image: PHOTOS.matka,
          vendor: 'Shyam Pottery'
        },
        {
          name: 'Kulhad (Pack of 6)',
          price: 249,
          quantity: 2,
          image: PHOTOS.kulhad,
          vendor: 'Shyam Pottery'
        }
      ],
      shippingAddress: 'Haveli 12, Johari Bazaar, Jaipur, Rajasthan 302003',
      trackingNumber: 'SHIP-JM-89103'
    }
  ]);

  const [flyingItems, setFlyingItems] = useState([]);

  useEffect(() => {
    if (productsLoading || products.length === 0) return;
    setCart((prev) => syncCartWithCatalog(prev, products));
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
    setWishlist(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  const clearCart = () => setCart([]);

  const addOrder = (orderData) => {
    const newOrder = {
      id: `ORD-JM-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Confirmed',
      total: cartTotal,
      items: [...cart],
      ...orderData
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

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
        cart,
        cartCount,
        cartTotal,
        wishlist,
        wishlistCount,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        deliveryLocation,
        setDeliveryLocation,
        orders,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleWishlist,
        isInWishlist,
        clearCart,
        addOrder,
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
