import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { OpButton } from './AdminFaqs';
import { fetchFaqCategories, updateFaqCategory, deleteFaqCategory } from '../../utils/faqsApi';

const AdminFaqCategories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchFaqCategories();
      setCategories(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{categories.findIndex((c) => c.id === row.id) + 1}</span> },
    {
      header: 'Name',
      accessor: 'name',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/faqs/categories/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.name}
        </button>
      ),
    },
    { header: 'Created At', accessor: 'createdAt', cell: (row) => <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—'}</span> },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${row.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Operations',
      sortable: false,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <OpButton variant="edit" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/faqs/categories/edit/${row.id}`); }} />
          <OpButton
            variant="delete"
            title="Delete"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete category "${row.name}"?`)) return;
              try {
                await deleteFaqCategory(row.id);
                await load();
              } catch (err) {
                setError(err.parsedMessage || err.message || 'Delete failed.');
              }
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="FAQ Categories" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={categories}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/faqs/categories/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateFaqCategory(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteFaqCategory(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/faqs/categories/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminFaqCategories;
