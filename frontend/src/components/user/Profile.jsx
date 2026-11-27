import React, { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Package,
  Heart,
  LogOut,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { disablePush } from '../../services/pushNotificationService';
import PushPermissionPrompt from '../shared/PushPermissionPrompt';
import { usePageSeo } from '../../utils/seo';
import api from '../../utils/api';

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** The default saved address, or the first one, as a single line. */
const addressText = (u) => {
  const list = Array.isArray(u.addresses) ? u.addresses : [];
  const a = list.find((x) => x?.isDefault) || list[0];
  if (a) {
    const line = a.addressLine || [a.address, a.city, a.state, a.pincode].filter(Boolean).join(', ');
    if (line) return line;
  }
  return typeof u.address === 'string' && u.address ? u.address : '';
};

/**
 * Profile — shows registration-style details (name, gender, email, mobile, address).
 */
const Profile = () => {
  usePageSeo({ title: 'My Profile', noindex: true });
  const { user, orders, wishlist, setUser, setIsAuthenticated, isAuthenticated } = useShop();
  const navigate = useNavigate();

  // The details saved at login can be incomplete or out of date (for example,
  // an email changed by the admin), so load the account from the server.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    api
      .get('/users/profile')
      .then((res) => {
        const fresh = res.data?.data?.user;
        if (cancelled || !fresh) return;
        const { password, otp, otpExpiry, privateNotes, ...safe } = fresh;
        setUser?.((prev) => {
          const next = { ...(prev || {}), ...safe };
          try {
            localStorage.setItem('jaipurio_user', JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
      })
      .catch(() => {
        /* keep showing the saved details */
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setUser]);

  const profile = useMemo(() => {
    const saved = user || {};
    let fromStorage = {};
    try {
      fromStorage = JSON.parse(localStorage.getItem('jaipurio_user') || '{}');
    } catch {
      fromStorage = {};
    }
    const u = { ...fromStorage, ...saved };
    return {
      name: u.name || 'Customer',
      gender: capitalize(u.gender) || '—',
      email: u.email || '—',
      mobile: u.mobile || u.phone || '',
      address: addressText(u) || '—',
    };
  }, [user]);

  // Account pages need a signed-in customer — never show someone else's details.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  }

  const initials = profile.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    disablePush('user'); // remove this device while the login token is still valid
    try {
      localStorage.removeItem('jaipurio_auth');
      localStorage.removeItem('jaipurio_user');
      localStorage.removeItem('customer_token');
    } catch {
      /* ignore */
    }
    setUser?.(null);
    setIsAuthenticated?.(false);
    navigate('/login', { replace: true });
  };

  const rows = [
    { label: 'Full Name', value: profile.name, Icon: User },
    { label: 'Gender', value: profile.gender, Icon: Users },
    { label: 'Email', value: profile.email, Icon: Mail },
    { label: 'Mobile', value: profile.mobile ? `+91 ${profile.mobile}` : '—', Icon: Phone },
    { label: 'Delivery Address', value: profile.address, Icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-white py-4 pb-14">
      <div className="max-w-lg mx-auto px-3 sm:px-4">
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 shadow-sm mb-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#6F241D] text-white flex items-center justify-center font-playfair font-semibold text-lg shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-dm text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8B2E1E]">
                Khammaghani & Welcome
              </p>
              <h1 className="font-playfair font-semibold text-lg text-[#3F261B] truncate leading-tight">
                {profile.name}
              </h1>
              <p className="font-dm text-[11px] text-[#806653] truncate">{profile.email}</p>
            </div>
          </div>
        </div>

        <PushPermissionPrompt
          role="user"
          title="Get order updates on this device"
          text="We'll tell you when your order is confirmed, shipped and delivered."
          dismissible={false}
          showBlocked
          className="mb-3"
        />

        <div className="bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-sm mb-3">
          <div className="px-3.5 py-2 border-b border-[#EFEAE3]">
            <h2 className="font-dm text-[11px] font-semibold text-[#3F261B]">Account details</h2>
          </div>
          <ul className="divide-y divide-[#F0EBE4]">
            {rows.map(({ label, value, Icon }) => (
              <li key={label} className="flex items-start gap-2.5 px-3.5 py-2.5">
                <div className="w-7 h-7 rounded-md bg-[#F7F3EE] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-[#6F241D]" />
                </div>
                <div className="min-w-0">
                  <p className="font-dm text-[9px] font-medium uppercase tracking-wide text-[#9A8B7A]">
                    {label}
                  </p>
                  <p className="font-dm text-[12px] font-medium text-[#3F261B] leading-snug break-words">
                    {value}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Link
            to="/orders"
            className="bg-white border border-[#E8E2D9] rounded-xl p-3 flex items-center justify-between hover:border-[#6F241D]/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Package size={16} className="text-[#6F241D] shrink-0" />
              <div className="min-w-0">
                <p className="font-dm text-[11px] font-semibold text-[#3F261B]">My Orders</p>
                <p className="font-dm text-[9px] text-[#806653]">{orders?.length || 0} orders</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#9A8B7A]" />
          </Link>
          <Link
            to="/wishlist"
            className="bg-white border border-[#E8E2D9] rounded-xl p-3 flex items-center justify-between hover:border-[#6F241D]/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Heart size={16} className="text-[#6F241D] shrink-0" />
              <div className="min-w-0">
                <p className="font-dm text-[11px] font-semibold text-[#3F261B]">Wishlist</p>
                <p className="font-dm text-[9px] text-[#806653]">{wishlist?.length || 0} saved</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-[#9A8B7A]" />
          </Link>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#E8E2D9] font-dm text-[12px] font-semibold text-[#8B2E1E] hover:bg-[#FDF6F4] transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </div>
  );
};

export default Profile;
