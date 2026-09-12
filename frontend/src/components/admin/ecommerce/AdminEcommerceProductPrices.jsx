import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FiEdit2, FiCheck, FiX, FiExternalLink } from 'react-icons/fi';
import { PHOTOS } from '../../../data/photos';

// Mock product price data matching the live Botble CMS product prices table
const initialPriceData = [
  {
    id: '7878',
    image: '/planter.png',
    name: 'Comfy White Hunting Style Cotton Shirt - Premium Comfort Style | Jaipurio',
    sku: 'JAI-CL-CWH-001',
    regularPrice: 1700,
    salePrice: '',
    startDate: '',
    endDate: '',
    costPerItem: 1020,
    status: 'Published'
  },
  {
    id: '7877',
    image: '/planter.png',
    name: 'Handcrafted Blue Pottery Vase - Traditional Jaipur Art',
    sku: 'JAI-BP-VAS-002',
    regularPrice: 2499,
    salePrice: 1999,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    costPerItem: 1200,
    status: 'Published'
  },
  {
    id: '7876',
    image: '/planter.png',
    name: 'Rajasthani Design Matka (5L) - Natural Clay Water Pot',
    sku: 'JAI-MT-5L-003',
    regularPrice: 599,
    salePrice: 399,
    startDate: '',
    endDate: '',
    costPerItem: 280,
    status: 'Published'
  },
  {
    id: '7875',
    image: '/planter.png',
    name: 'Kulhad (Pack of 6) - Traditional Terracotta Chai Cups',
    sku: 'JAI-KH-PK6-004',
    regularPrice: 349,
    salePrice: 249,
    startDate: '',
    endDate: '',
    costPerItem: 160,
    status: 'Draft'
  },
  {
    id: '7874',
    image: '/planter.png',
    name: 'Handmade Mitti Planter - 8 Inch Garden Terracotta Pot',
    sku: 'JAI-PL-8IN-005',
    regularPrice: 499,
    salePrice: 349,
    startDate: '2026-08-01',
    endDate: '2026-10-01',
    costPerItem: 200,
    status: 'Published'
  },
  {
    id: '7873',
    image: '/planter.png',
    name: 'Decorative Diya Set (8 Pcs) - Festive Terracotta Diyas',
    sku: 'JAI-DY-SET8-006',
    regularPrice: 399,
    salePrice: 299,
    startDate: '',
    endDate: '',
    costPerItem: 150,
    status: 'Published'
  },
  {
    id: '7872',
    image: '/planter.png',
    name: 'Jaipur Blue Pottery Bowl - Hand Painted Ceramic Art',
    sku: 'JAI-BP-BWL-007',
    regularPrice: 899,
    salePrice: '',
    startDate: '',
    endDate: '',
    costPerItem: 420,
    status: 'Published'
  },
  {
    id: '7871',
    image: '/planter.png',
    name: 'Terracotta Wall Hanging Set - 3 Pieces Rustic Decor',
    sku: 'JAI-WH-SET3-008',
    regularPrice: 1299,
    salePrice: 999,
    startDate: '2026-09-10',
    endDate: '2026-09-25',
    costPerItem: 600,
    status: 'Published'
  }
];

// Inline editable price cell
const EditablePriceCell = ({ value, onSave, prefix = '₹' }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave(val === '' ? '' : Number(val));
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleCancel = () => {
    setVal(value ?? '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-slate-500 text-xs">{prefix}</span>
        <input
          autoFocus
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="w-24 border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0.00"
        />
        <button
          onClick={handleSave}
          className="p-0.5 text-emerald-600 hover:text-emerald-700"
          title="Save"
        >
          <FiCheck size={13} />
        </button>
        <button
          onClick={handleCancel}
          className="p-0.5 text-rose-500 hover:text-rose-600"
          title="Cancel"
        >
          <FiX size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-1 text-left hover:text-blue-600 transition-colors ${
        saved ? 'text-emerald-600' : ''
      }`}
      title="Click to edit"
    >
      <span className="font-semibold text-slate-800">
        {val === '' || val === null || val === undefined || val === ''
          ? <span className="text-slate-400 font-normal italic">—</span>
          : `${prefix}${Number(val).toLocaleString('en-IN')}.00`}
      </span>
      <FiEdit2
        size={11}
        className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
      />
    </button>
  );
};

// Editable date cell
const EditableDateCell = ({ value, label, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');

  const handleSave = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="date"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={handleSave} className="p-0.5 text-emerald-600"><FiCheck size={12} /></button>
        <button onClick={() => setEditing(false)} className="p-0.5 text-rose-500"><FiX size={12} /></button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1 text-left hover:text-blue-600 text-xs"
      title="Click to edit"
    >
      <span className={val ? 'text-slate-700' : 'text-slate-400 italic'}>
        {val || '—'}
      </span>
      <FiEdit2 size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
    </button>
  );
};

export const AdminEcommerceProductPrices = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(initialPriceData);

  const updateField = (id, field, value) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      width: '60px',
      cell: (row) => (
        <span className="font-semibold text-slate-700">{row.id}</span>
      )
    },
    {
      header: 'Image',
      accessor: 'image',
      width: '60px',
      sortable: false,
      cell: (row) => (
        <img
          src={row.image}
          alt={row.name}
          className="w-10 h-10 object-cover rounded border border-slate-200 bg-slate-50"
          onError={(e) => { e.target.src = 'https://placehold.co/40x40/f1f5f9/94a3b8?text=IMG'; }}
        />
      )
    },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <div>
          <Link
            to={`/admin/ecommerce/products/edit/${row.id}`}
            className="font-medium text-slate-800 hover:text-blue-600 hover:underline leading-snug block text-[12px]"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{row.sku}</div>
        </div>
      )
    },
    {
      header: 'Price',
      accessor: 'regularPrice',
      width: '130px',
      cell: (row) => (
        <EditablePriceCell
          value={row.regularPrice}
          onSave={(val) => updateField(row.id, 'regularPrice', val)}
        />
      )
    },
    {
      header: 'Sale price',
      accessor: 'salePrice',
      width: '130px',
      cell: (row) => (
        <EditablePriceCell
          value={row.salePrice}
          onSave={(val) => updateField(row.id, 'salePrice', val)}
        />
      )
    },
    {
      header: 'Start date',
      accessor: 'startDate',
      width: '120px',
      cell: (row) => (
        <EditableDateCell
          value={row.startDate}
          label="Start"
          onSave={(val) => updateField(row.id, 'startDate', val)}
        />
      )
    },
    {
      header: 'End date',
      accessor: 'endDate',
      width: '120px',
      cell: (row) => (
        <EditableDateCell
          value={row.endDate}
          label="End"
          onSave={(val) => updateField(row.id, 'endDate', val)}
        />
      )
    },
    {
      header: 'Cost per item',
      accessor: 'costPerItem',
      width: '130px',
      cell: (row) => (
        <EditablePriceCell
          value={row.costPerItem}
          onSave={(val) => updateField(row.id, 'costPerItem', val)}
        />
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '90px',
      cell: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            row.status === 'Published'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status}
        </span>
      )
    },
    {
      header: 'Operations',
      sortable: false,
      width: '90px',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/ecommerce/products/edit/${row.id}`}
            className="text-blue-600 hover:underline text-[11px] font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setData((prev) => prev.filter((r) => r.id !== row.id));
            }}
            className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <EcommerceLayout breadcrumb={['PRODUCTS', 'PRODUCT PRICES']}>
      {/* Info tip */}
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700 flex items-start gap-2">
        <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>
          Click on <strong>Price</strong>, <strong>Sale price</strong>, <strong>Start/End date</strong>, or <strong>Cost per item</strong> values to edit them inline. Press <kbd className="bg-blue-100 border border-blue-300 rounded px-1 text-[10px]">Enter</kbd> to save or <kbd className="bg-blue-100 border border-blue-300 rounded px-1 text-[10px]">Esc</kbd> to cancel.
        </span>
      </div>

      <AdminDataTable
        columns={columns}
        data={data}
        showCreate={false}
        searchPlaceholder="Filter by name or SKU..."
        onRowClick={(row) => navigate(`/admin/ecommerce/products/edit/${row.id}`)}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductPrices;
