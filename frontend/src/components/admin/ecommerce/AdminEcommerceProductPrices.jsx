import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { fetchAdminProducts } from '../../../utils/marketplaceApi';
import api from '../../../utils/api';

const toDateInput = (d) => (d ? String(d).slice(0, 10) : '');

const mapPriceRow = (p) => ({
  id: String(p._id || p.id),
  image: p.image || (Array.isArray(p.images) ? p.images[0] : '') || '/planter.png',
  name: p.title || p.name,
  sku: p.sku || '',
  regularPrice: p.price ?? '',
  salePrice: p.salePrice ?? '',
  startDate: toDateInput(p.saleStartDate),
  endDate: toDateInput(p.saleEndDate),
  costPerItem: p.costPerItem ?? '',
  status: p.lifecycle || (p.published ? 'Published' : 'Draft'),
});

const FIELD_TO_PAYLOAD_KEY = {
  regularPrice: 'price',
  salePrice: 'salePrice',
  startDate: 'saleStartDate',
  endDate: 'saleEndDate',
  costPerItem: 'costPerItem',
};

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const rows = await fetchAdminProducts();
      setData(rows.map(mapPriceRow));
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = async (id, field, value) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
    const payloadKey = FIELD_TO_PAYLOAD_KEY[field];
    if (!payloadKey) return;
    try {
      await api.put(`/products/${id}`, { [payloadKey]: value === '' ? null : value });
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to save change.');
      await load();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      await load();
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to delete product.');
    }
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
              handleDelete(row.id);
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
      {loadError && (
        <div className="mb-3 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError}
        </div>
      )}
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
        showReload
        onReload={load}
        searchPlaceholder="Filter by name or SKU..."
        onRowClick={(row) => navigate(`/admin/ecommerce/products/edit/${row.id}`)}
      />
      {loading && <div className="text-center text-xs text-slate-400 py-4">Loading…</div>}
    </EcommerceLayout>
  );
};

export default AdminEcommerceProductPrices;
