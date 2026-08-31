import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const shouldLoadCatalog = (pathname) =>
  pathname === '/home'
  || pathname === '/shop'
  || pathname.startsWith('/product/')
  || pathname.startsWith('/store/')
  || pathname === '/checkout'
  || pathname === '/wishlist';

/** Loads public shop catalog only on customer-facing routes — not vendor/admin. */
export default function ShopCatalogSync() {
  const { pathname } = useLocation();
  const { refreshProducts } = useShop();
  const lastPath = useRef('');

  useEffect(() => {
    if (!shouldLoadCatalog(pathname)) return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    refreshProducts();
  }, [pathname, refreshProducts]);

  return null;
}
