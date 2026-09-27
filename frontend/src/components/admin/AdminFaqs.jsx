import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import AdminPageHeader from './AdminPageHeader';
import AdminDataTable from './ecommerce/AdminDataTable';
import { fetchFaqs, updateFaq, deleteFaq } from '../../utils/faqsApi';

export const OpButton = ({ variant = 'edit', onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`h-7 w-7 rounded-md flex items-center justify-center text-white transition ${
      variant === 'edit' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700'
    }`}
  >
    {variant === 'edit' ? <FiEdit2 size={13} /> : <FiTrash2 size={13} />}
  </button>
);

const AdminFaqs = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await fetchFaqs();
      setFaqs(rows);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load FAQs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = [
    { header: 'ID', accessor: 'id', width: '60px', cell: (row) => <span className="text-slate-500">{faqs.findIndex((f) => f.id === row.id) + 1}</span> },
    {
      header: 'Question',
      accessor: 'question',
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/faqs/edit/${row.id}`); }}
          className="text-blue-600 hover:underline font-semibold text-left"
        >
          {row.question}
        </button>
      ),
    },
    { header: 'Category', accessor: 'categoryName', cell: (row) => <span>{row.categoryName || '—'}</span> },
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
          <OpButton variant="edit" title="Edit" onClick={(e) => { e.stopPropagation(); navigate(`/admin/faqs/edit/${row.id}`); }} />
          <OpButton
            variant="delete"
            title="Delete"
            onClick={async (e) => {
              e.stopPropagation();
              if (!window.confirm(`Delete FAQ "${row.question}"?`)) return;
              try {
                await deleteFaq(row.id);
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
      <AdminPageHeader title="FAQs" hideAction />
      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}
      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <AdminDataTable
          columns={columns}
          data={faqs}
          showCreate
          createLabel="Create"
          onCreate={() => navigate('/admin/faqs/create')}
          showExport={false}
          showReload
          onReload={load}
          searchPlaceholder="Search..."
          filterFields={[
            { key: 'question', label: 'Question', type: 'text' },
            { key: 'createdAt', label: 'Created At', type: 'date' },
          ]}
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => updateFaq(item.id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => deleteFaq(item.id)));
            await load();
          }}
          onRowClick={(row) => navigate(`/admin/faqs/edit/${row.id}`)}
        />
      )}
    </div>
  );
};

export default AdminFaqs;
