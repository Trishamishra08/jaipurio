import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import {
  ecommerceRemove,
  ecommerceUpdate,
  liveEcommerceList,
} from '../../../utils/ecommerceApi';

const LIST_PATH = '/admin/ecommerce/specification-attributes';
const RESOURCE = 'specification-attributes';

const mapRow = (r) => ({
  ...r,
  id: String(r._id || r.id || r.legacyId || ''),
  groupLabel: r.groupName || r.group?.name || '—',
  createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : '',
});

export const AdminEcommerceSpecificationAttributes = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await liveEcommerceList(RESOURCE);
      setRows((Array.isArray(list) ? list : []).map(mapRow));
    } catch (err) {
      setRows([]);
      setError(err?.parsedMessage || err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '90px' },
      {
        header: 'Name',
        accessor: 'name',
        cell: (row) => (
          <Link
            to={`${LIST_PATH}/edit/${row.id}`}
            className="font-semibold text-blue-600 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
        ),
      },
      { header: 'Group', accessor: 'groupLabel' },
      { header: 'Type', accessor: 'type' },
      { header: 'Created At', accessor: 'createdAt' },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <Link
              to={`${LIST_PATH}/edit/${row.id}`}
              className="text-blue-600 hover:underline text-[11px] font-medium flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <FiEdit size={12} />
              Edit
            </Link>
            <button
              type="button"
              className="text-red-500 hover:underline text-[11px] font-medium flex items-center gap-0.5"
              onClick={async (e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete "${row.name}"?`)) return;
                try {
                  await ecommerceRemove(RESOURCE, row._id || row.id);
                  await load();
                } catch (err) {
                  window.alert(err?.parsedMessage || err?.message || 'Delete failed');
                }
              }}
            >
              <FiTrash2 size={12} />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [load]
  );

  return (
    <EcommerceLayout breadcrumb={['SPECIFICATION ATTRIBUTES']}>
      {error ? (
        <div className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2">
          {error}
        </div>
      ) : null}
      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">Loading attributes…</div>
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
          bulkStatusOptions={['Published', 'Draft']}
          onBulkStatusChange={async (items, status) => {
            await Promise.all(
              items.map((item) => ecommerceUpdate(RESOURCE, item._id || item.id, { status }))
            );
            await load();
          }}
          onBulkDelete={async (items) => {
            await Promise.all(
              items.map((item) => ecommerceRemove(RESOURCE, item._id || item.id))
            );
            await load();
          }}
          onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
        />
      )}
    </EcommerceLayout>
  );
};

export default AdminEcommerceSpecificationAttributes;
