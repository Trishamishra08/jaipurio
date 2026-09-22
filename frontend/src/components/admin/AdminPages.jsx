import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './ecommerce/EcommerceLayout';
import AdminDataTable from './ecommerce/AdminDataTable';
import { pagesList, pagesRemove, pagesUpdate } from '../../utils/pagesApi';

const LIST_PATH = '/admin/pages';

const mapRow = (r) => ({
  ...r,
  id: String(r.legacyId ?? r._id ?? r.id ?? ''),
  mongoId: String(r._id || r.id || ''),
  createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : '',
});

export const AdminPages = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await pagesList();
      setRows((Array.isArray(list) ? list : []).map(mapRow));
    } catch (err) {
      setRows([]);
      setError(err?.parsedMessage || err?.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '70px' },
      {
        header: 'Name',
        accessor: 'name',
        cell: (row) => (
          <Link
            to={`${LIST_PATH}/edit/${row.mongoId}`}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
        ),
      },
      { header: 'Template', accessor: 'template' },
      { header: 'Created At', accessor: 'createdAt' },
      {
        header: 'Status',
        accessor: 'status',
        cell: (row) => (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {row.status || 'Published'}
          </span>
        ),
      },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <Link
              to={`${LIST_PATH}/edit/${row.mongoId}`}
              className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <FiEdit size={12} />
              <span>Edit</span>
            </Link>
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete "${row.name}"?`)) return;
                try {
                  await pagesRemove(row.mongoId);
                  await load();
                } catch (err) {
                  window.alert(err?.parsedMessage || err?.message || 'Delete failed');
                }
              }}
              className="text-red-500 hover:text-red-700 hover:underline text-[11px] font-medium flex items-center gap-0.5"
            >
              <FiTrash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        ),
      },
    ],
    [load]
  );

  return (
    <EcommerceLayout breadcrumb={['PAGES']}>
      {error ? (
        <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading pages…</div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={rows}
          createLabel="Create"
          searchPlaceholder="Search..."
          showExport={false}
          onCreate={() => navigate(`${LIST_PATH}/create`)}
          onReload={load}
          emptyMessage="No data to display"
          bulkStatusOptions={['Published', 'Draft', 'Pending']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(items.map((item) => pagesUpdate(item.mongoId || item._id, { status })));
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(items.map((item) => pagesRemove(item.mongoId || item._id)));
            await load();
          }}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.mongoId}`)}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminPages;
