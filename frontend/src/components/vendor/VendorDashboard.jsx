import React, { useState } from 'react';
import { useShop } from '../../context/ShopContext';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Star, 
  Store, 
  Settings, 
  LogOut,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const VendorDashboard = () => {
  const { products, addProduct, deleteProduct, vendors } = useShop();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Matkas',
    subcategory: 'Water Pots',
    price: '',
    oldPrice: '',
    material: 'Pure Mitti / Terracotta',
    size: 'Standard',
    weight: '1.2 kg',
    description: '',
    image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80',
    vendor: 'Shyam Pottery, Jaipur',
    location: 'Jaipur, Rajasthan',
    stock: 20
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;
    addProduct({
      ...newProd,
      price: Number(newProd.price),
      oldPrice: Number(newProd.oldPrice || newProd.price * 1.3),
      stock: Number(newProd.stock)
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setActiveTab('products');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* Vendor Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#3D1E16] text-[#E8D4B5] p-4 flex flex-col justify-between shrink-0 border-r border-[#C69A45]/40">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-2 pb-4 border-b border-[#E8D4B5]/20 mb-4">
            <div>
              <h2 className="font-playfair font-semibold text-lg text-white">jaipurio</h2>
              <p className="font-dm text-[10px] text-[#C69A45]">Vendor / Artisan Panel</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: <LayoutDashboard size={16} /> },
              { id: 'products', label: 'My Pottery Products', icon: <Package size={16} /> },
              { id: 'add-product', label: 'Add New Craft', icon: <PlusCircle size={16} /> },
              { id: 'orders', label: 'Vendor Orders', icon: <ShoppingBag size={16} /> },
              { id: 'store-profile', label: 'Store Profile', icon: <Store size={16} /> },
              { id: 'analytics', label: 'Sales Analytics', icon: <TrendingUp size={16} /> },
              { id: 'reviews', label: 'Customer Reviews', icon: <Star size={16} /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-[#A94E2C] text-white font-bold shadow-md' 
                    : 'text-[#E8D4B5]/80 hover:bg-[#4E271D] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#E8D4B5]/20">
          <div className="p-3 bg-[#4E271D] rounded-xl mb-3">
            <span className="text-[10px] font-bold text-[#C69A45] block">Logged in as</span>
            <span className="text-xs font-bold text-white">Shyam Pottery (Jaipur)</span>
          </div>
          <a
            href="/home"
            className="flex items-center gap-2 text-xs font-bold text-[#E8D4B5]/80 hover:text-white"
          >
            <LogOut size={15} />
            <span>Switch to Customer Store</span>
          </a>
        </div>
      </aside>

      {/* Main Vendor Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#6F241D]">Artisan Dashboard</h1>
              <p className="text-xs sm:text-sm text-[#70452F]">Monitor sales, handcrafted inventory, and workshop orders.</p>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Total Mitti Revenue</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">₹1,48,920</h3>
                <span className="text-[10px] text-[#354B35] font-bold flex items-center gap-1 mt-1">
                  <ArrowUpRight size={12} /> +18.4% this month
                </span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Total Orders</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">342</h3>
                <span className="text-[10px] text-gray-500 mt-1 block">12 pending shipment</span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Listed Products</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">{products.length}</h3>
                <span className="text-[10px] text-[#354B35] font-bold mt-1 block">All Active</span>
              </div>
              <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-2xl p-5 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-[#70452F]">Artisan Rating</span>
                <h3 className="text-2xl font-black text-[#6F241D] mt-1">4.9 ★</h3>
                <span className="text-[10px] text-gray-500 mt-1 block">340 verified buyer reviews</span>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-lg text-[#6F241D] mb-4">Recent Customer Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8D4B5] text-[#70452F] uppercase text-[10px]">
                      <th className="py-2.5">Order ID</th>
                      <th className="py-2.5">Product</th>
                      <th className="py-2.5">Customer</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D4B5]/60">
                    <tr>
                      <td className="py-3 font-bold text-[#6F241D]">ORD-JM-8921</td>
                      <td className="py-3">Rajasthani Design Matka (5L)</td>
                      <td className="py-3">Priya Sharma (Delhi)</td>
                      <td className="py-3 font-bold">₹897</td>
                      <td className="py-3"><span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Packed</span></td>
                    </tr>
                    <tr>
                      <td className="py-3 font-bold text-[#6F241D]">ORD-JM-8919</td>
                      <td className="py-3">Chai Kulhad Set (Pack of 6)</td>
                      <td className="py-3">Rajesh Verma (Jaipur)</td>
                      <td className="py-3 font-bold">₹498</td>
                      <td className="py-3"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold">Delivered</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS LIST */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#6F241D]">My Handcrafted Products</h1>
                <p className="text-xs text-[#70452F]">Manage catalog, pricing, and workshop inventory.</p>
              </div>
              <button
                onClick={() => setActiveTab('add-product')}
                className="bg-[#A94E2C] hover:bg-[#873A24] text-white px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
              >
                <PlusCircle size={14} />
                <span>Add Product</span>
              </button>
            </div>

            <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF4EA] border-b border-[#E8D4B5] text-[#70452F] uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D4B5]">
                  {products.map(p => (
                    <tr key={p._id} className="hover:bg-[#FAF4EA]/50">
                      <td className="p-3.5 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <span className="font-bold text-[#2B1E1A] block">{p.name}</span>
                          <span className="text-[10px] text-gray-400">{p.material}</span>
                        </div>
                      </td>
                      <td className="p-3.5">{p.category}</td>
                      <td className="p-3.5 font-bold text-[#6F241D]">₹{p.price}</td>
                      <td className="p-3.5">{p.stock || 20} in stock</td>
                      <td className="p-3.5">{p.rating} ★</td>
                      <td className="p-3.5 text-right space-x-2">
                        <button 
                          onClick={() => deleteProduct(p._id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ADD PRODUCT */}
        {activeTab === 'add-product' && (
          <div className="max-w-2xl bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h1 className="text-2xl font-serif font-black text-[#6F241D]">Add New Handcrafted Item</h1>
              <p className="text-xs text-[#70452F]">Publish your handcrafted pottery directly to the Rajasthan marketplace.</p>
            </div>

            {savedSuccess && (
              <div className="p-3 bg-[#82977A]/20 border border-[#354B35] rounded-xl text-xs text-[#354B35] font-bold flex items-center gap-2">
                <CheckCircle size={16} />
                <span>Product published successfully to Jaipur Mitti Bazaar!</span>
              </div>
            )}

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Craft / Product Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Jaipuri Floral Water Surahi (3L)" 
                  value={newProd.name}
                  onChange={e => setNewProd({...newProd, name: e.target.value})}
                  className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5 text-[#2B1E1A]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Category</label>
                  <select 
                    value={newProd.category}
                    onChange={e => setNewProd({...newProd, category: e.target.value})}
                    className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5"
                  >
                    <option value="Matkas">Matkas & Surahis</option>
                    <option value="Kulhads">Kulhads & Chai Cups</option>
                    <option value="Planters">Mitti Planters</option>
                    <option value="Home Decor">Home Decor & Figurines</option>
                    <option value="Puja Essentials">Puja Essentials & Diyas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Price (₹ INR)</label>
                  <input 
                    type="number" 
                    placeholder="399" 
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: e.target.value})}
                    className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Craft Description & Mitti Type</label>
                <textarea 
                  rows={3}
                  placeholder="Describe your hand-wheel technique, clay sourcing, and natural benefits..."
                  value={newProd.description}
                  onChange={e => setNewProd({...newProd, description: e.target.value})}
                  className="w-full bg-white border border-[#E8D4B5] rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="px-5 py-2 rounded-full border border-[#A94E2C] text-[#A94E2C] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6F241D] hover:bg-[#873A24] text-white px-6 py-2.5 rounded-full font-bold shadow-md"
                >
                  Publish Craft Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* OTHER TABS FALLBACK */}
        {(activeTab === 'orders' || activeTab === 'store-profile' || activeTab === 'analytics' || activeTab === 'reviews') && (
          <div className="bg-[#FCF8F2] border border-[#E8D4B5] rounded-3xl p-8 text-center space-y-3">
            <span className="text-3xl">🏺</span>
            <h3 className="font-serif font-bold text-lg text-[#6F241D] capitalize">{activeTab.replace('-', ' ')}</h3>
            <p className="text-xs text-[#70452F]">All vendor records and live artisan reports are linked to your master account.</p>
          </div>
        )}

      </main>
    </div>
  );
};

export default VendorDashboard;
