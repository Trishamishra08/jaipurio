import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import EcommerceLayout from './EcommerceLayout';
import AdminDataTable from './AdminDataTable';
import { SPECIFICATION_GROUPS } from '../../../data/specificationGroups';
import { liveEcommerceList } from '../../../utils/ecommerceApi';

const LIST_PATH = '/admin/product-specification/groups';

export const AdminEcommerceSpecificationGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState(SPECIFICATION_GROUPS);

  useEffect(() => {
    liveEcommerceList('specification-groups', SPECIFICATION_GROUPS).then((rows) => {
      setGroups(
        rows.map((r) => ({
          ...r,
          id: String(r._id || r.id || r.legacyId),
          createdAt: r.createdAt ? String(r.createdAt).slice(0, 10) : r.createdAt,
        }))
      );
    });
  }, []);

  const columns = useMemo(
    () => [
      { header: 'ID', accessor: 'id', width: '70px' },
      {
        header: 'Name',
        accessor: 'name',
        cell: (row) => (
          <Link
            to={`${LIST_PATH}/edit/${row.id}`}
            className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
        ),
      },
      {
        header: 'Description',
        accessor: 'description',
        cell: (row) => (
          <span className="text-slate-600">{row.description || '—'}</span>
        ),
      },
      { header: 'Created At', accessor: 'createdAt' },
      {
        header: 'Operations',
        sortable: false,
        cell: (row) => (
          <div className="flex items-center gap-2.5">
            <Link
              to={`${LIST_PATH}/edit/${row.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline text-[11px] font-medium flex items-center gap-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <FiEdit size={12} />
              <span>Edit</span>
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGroups((prev) => prev.filter((g) => g.id !== row.id));
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
    []
  );

  return (
    <EcommerceLayout breadcrumb={['PRODUCT SPECIFICATION', 'SPECIFICATION GROUPS']}>
      <AdminDataTable
        columns={columns}
        data={groups}
        createLabel="Create"
        searchPlaceholder="Search..."
        showExport={false}
        onCreate={() => navigate(`${LIST_PATH}/create`)}
        onRowClick={(row) => navigate(`${LIST_PATH}/edit/${row.id}`)}
      />
    </EcommerceLayout>
  );
};

export default AdminEcommerceSpecificationGroups;
