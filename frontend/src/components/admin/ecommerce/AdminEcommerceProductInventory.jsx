import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import { FiRefreshCw, FiSearch, FiChevronDown } from 'react-icons/fi';

// ─── Mock Data matching the live jaipurio.in product inventory ─────────────────
const initialInventory = [
  {
    id: '999',
    image: '/planter.png',
    name: '10 Inch Brass Ganesh on Throne: Royal Umbrella Design | Traditional Temple Art | Majestic Sitting Pose | Sacred Home Decor',
    sku: 'JIP-RL-BGTU-001',
    storehouseManagement: false,
    quantity: null
  },
  {
    id: '824',
    image: '/planter.png',
    name: '10K Solid Gold Flower Necklace | Real Gold Dainty Women\'s Chain | Elegant Floral Pendant | Perfect Gift for Her | Jaipurio Luxury Jewelry Collection',
    sku: 'JIP-GFN-10KT-001',
    storehouseManagement: true,
    quantity: 10
  },
  {
    id: '914',
    image: '/planter.png',
    name: '10K Solid Gold Flower Necklace: Real Gold Dainty Chain | Authentic Women\'s Jewelry | Delicate Floral Design | Perfect Choice',
    sku: 'JIP-JW-SGFN-001',
    storehouseManagement: true,
    quantity: 10
  },
  {
    id: '998',
    image: '/planter.png',
    name: '18 Inch Golden Lord Ganesha Idol: Large Temple Grade Murti | Divine Home Pooja Statue | Premium Golden Finish | Sacred Decor Art',
    sku: 'JIP-RL-GGNS-001',
    storehouseManagement: false,
    quantity: null
  },
  {
    id: '829',
    image: '/planter.png',
    name: '18Inch Cowhide Leather Backpack for Men | Full Grain Leather Rucksack | Hipster Office Backpack | Birthday Gift Idea | Jaipurio Premium Leather Collection',
    sku: 'JIP-CLB-FGBP-001',
    storehouseManagement: true,
    quantity: 10
  },
  {
    id: '7878',
    image: '/planter.png',
    name: 'Comfy White Hunting Style Cotton Shirt - Premium Comfort Style | Jaipurio',
    sku: 'JAI-CL-CWH-001',
    storehouseManagement: false,
    quantity: null
  },
  {
    id: '7877',
    image: '/planter.png',
    name: 'Handcrafted Blue Pottery Vase - Traditional Jaipur Art',
    sku: 'JAI-BP-VAS-002',
    storehouseManagement: true,
    quantity: 42
  },
  {
    id: '7876',
    image: '/planter.png',
    name: 'Rajasthani Design Matka (5L) - Natural Clay Water Pot',
    sku: 'JAI-MT-5L-003',
    storehouseManagement: false,
    quantity: null
  },
  {
    id: '7875',
    image: '/planter.png',
    name: 'Kulhad (Pack of 6) - Traditional Terracotta Chai Cups',
    sku: 'JAI-KH-PK6-004',
    storehouseManagement: true,
    quantity: 50
  },
  {
    id: '7874',
    image: '/planter.png',
    name: 'Handmade Mitti Planter - 8 Inch Garden Terracotta Pot',
    sku: 'JAI-PL-8IN-005',
    storehouseManagement: true,
    quantity: 35
  }
];

// ─── Storehouse Management Dropdown ────────────────────────────────────────────
const StorehouseDropdown = ({ value, onChange }) => (
  <div className="relative inline-block">
    <select
      value={value ? 'yes' : 'no'}
      onChange={(e) => onChange(e.target.value === 'yes')}
      className="appearance-none border border-slate-300 rounded-md text-xs px-3 py-1.5 pr-7 bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[80px]"
    >
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
    <FiChevronDown
      size={12}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
    />
  </div>
);

// ─── Quantity Cell — dropdown "In stock" when storehouse=No, number when Yes ───
const QuantityCell = ({ storehouseManagement, quantity, onChangeQty }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(quantity ?? 0);

  if (!storehouseManagement) {
    // Storehouse management OFF → show "In stock" dropdown (non-managed)
    return (
      <div className="relative inline-block">
        <select
          className="appearance-none border border-slate-300 rounded-md text-xs px-3 py-1.5 pr-7 bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[90px]"
          defaultValue="in_stock"
        >
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
        </select>
        <FiChevronDown
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    );
  }

  // Storehouse management ON → show editable number input
  return (
    <input
      type="number"
      min="0"
      value={val}
      onChange={(e) => {
        const n = Math.max(0, parseInt(e.target.value, 10) || 0);
        setVal(n);
        onChangeQty(n);
      }}
      className="w-20 border border-slate-300 rounded-md text-xs px-2.5 py-1.5 bg-white text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────
export const AdminEcommerceProductInventory = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const updateRow = (id, field, value) => {
    setInventory((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const filtered = inventory.filter((item) => {
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      item.id.includes(search)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT INVENTORY']}>
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs">

        {/* ── Top Toolbar: Search + Reload ── */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-52 border border-slate-300 rounded-md text-xs py-1.5 pl-3 pr-8 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <FiSearch className="absolute right-2.5 top-2.5 text-slate-400" size={13} />
          </div>
          <button
            onClick={() => setSearch('')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <FiRefreshCw size={13} className="text-slate-500" />
            <span>Reload</span>
          </button>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="w-10 px-3 py-2.5 text-center">
                  <input type="checkbox" className="rounded-sm border-slate-300 h-3.5 w-3.5" />
                </th>
                <th className="px-3.5 py-2.5 w-16">
                  <div className="flex items-center gap-1">ID <span className="text-slate-400 text-[9px]">↕</span></div>
                </th>
                <th className="px-3.5 py-2.5 w-14">Image</th>
                <th className="px-3.5 py-2.5">Products</th>
                <th className="px-3.5 py-2.5 w-44">Storehouse Management</th>
                <th className="px-3.5 py-2.5 w-32">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="w-10 px-3 py-3 text-center">
                      <input type="checkbox" className="rounded-sm border-slate-300 h-3.5 w-3.5" />
                    </td>
                    <td className="px-3.5 py-3 font-semibold text-slate-700">{row.id}</td>
                    <td className="px-3.5 py-3">
                      <img
                        src={row.image}
                        alt={row.name}
                        className="w-10 h-10 object-cover rounded border border-slate-200 bg-slate-50"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/40x40/f1f5f9/94a3b8?text=IMG';
                        }}
                      />
                    </td>
                    <td className="px-3.5 py-3">
                      <Link
                        to={`/admin/ecommerce/products/edit/${row.id}`}
                        className="text-blue-600 hover:underline font-medium leading-snug block text-[12px]"
                      >
                        {row.name}
                      </Link>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        SKU: {row.sku}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <StorehouseDropdown
                        value={row.storehouseManagement}
                        onChange={(val) => updateRow(row.id, 'storehouseManagement', val)}
                      />
                    </td>
                    <td className="px-3.5 py-3">
                      <QuantityCell
                        storehouseManagement={row.storehouseManagement}
                        quantity={row.quantity}
                        onChangeQty={(val) => updateRow(row.id, 'quantity', val)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-slate-300 rounded-md py-1 px-2 text-xs bg-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              {filtered.length === 0
                ? 'No record'
                : `Show from ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                    currentPage * pageSize,
                    filtered.length
                  )} in ${filtered.length} records`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-300 rounded-md text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              « Previous
            </button>
            <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold">
              {currentPage}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-300 rounded-md text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              Next »
            </button>
          </div>
        </div>
      </div>
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductInventory;
