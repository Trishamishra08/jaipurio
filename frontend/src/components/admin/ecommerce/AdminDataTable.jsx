import React, { useEffect, useRef, useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiFilter,
} from 'react-icons/fi';

export const AdminDataTable = ({
  title,
  columns = [],
  data = [],
  searchPlaceholder = 'Search...',
  onSearch,
  onCreate,
  createLabel = 'Create',
  onExport,
  onReload,
  showCreate = true,
  showExport = true,
  showReload = true,
  showBulkActions = true,
  showFilters = true,
  bulkStatusOptions = ['Published', 'Pending', 'Draft'],
  onBulkStatusChange,
  onBulkDelete,
  extraHeaderActions,
  emptyMessage = 'No data to display',
  onRowClick,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChangesOpen, setBulkChangesOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(bulkStatusOptions[0] || '');
  const bulkRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target)) {
        setBulkOpen(false);
        setBulkChangesOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    setBulkStatus(bulkStatusOptions[0] || '');
  }, [bulkStatusOptions]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(data.map((_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleSelectRow = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter((i) => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const selectedItems = selectedRows
    .map((idx) => data[idx])
    .filter(Boolean);

  const requireSelection = () => {
    if (!selectedItems.length) {
      window.alert('Please select at least one record.');
      return false;
    }
    return true;
  };

  const openStatusModal = () => {
    if (!requireSelection()) return;
    setBulkOpen(false);
    setBulkChangesOpen(false);
    setStatusModalOpen(true);
  };

  const applyBulkStatus = async () => {
    if (!requireSelection()) return;
    try {
      await onBulkStatusChange?.(selectedItems, bulkStatus);
      setStatusModalOpen(false);
      setSelectedRows([]);
    } catch (err) {
      window.alert(err?.message || 'Bulk status update failed');
    }
  };

  const applyBulkDelete = async () => {
    if (!requireSelection()) return;
    if (!window.confirm(`Delete ${selectedItems.length} selected record(s)?`)) return;
    setBulkOpen(false);
    setBulkChangesOpen(false);
    try {
      await onBulkDelete?.(selectedItems);
      setSelectedRows([]);
    } catch (err) {
      window.alert(err?.message || 'Bulk delete failed');
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs relative">
      <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {showBulkActions && (
            <div className="relative inline-block" ref={bulkRef}>
              <button
                type="button"
                onClick={() => {
                  setBulkOpen((v) => !v);
                  setBulkChangesOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <span>Bulk Actions</span>
                <FiChevronDown size={13} className="text-slate-500" />
              </button>

              {bulkOpen ? (
                <div className="absolute left-0 top-full mt-1 z-40 min-w-[180px] bg-white border border-slate-200 rounded-md shadow-lg py-1">
                  <div
                    className="relative"
                    onMouseEnter={() => setBulkChangesOpen(true)}
                    onMouseLeave={() => setBulkChangesOpen(false)}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => setBulkChangesOpen((v) => !v)}
                    >
                      <span>Bulk changes</span>
                      <FiChevronRight size={13} className="text-slate-400" />
                    </button>
                    {bulkChangesOpen ? (
                      <div className="absolute left-full top-0 ml-0.5 min-w-[140px] bg-white border border-slate-200 rounded-md shadow-lg py-1">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                          onClick={openStatusModal}
                        >
                          Status
                        </button>
                      </div>
                    ) : null}
                  </div>
                  {onBulkDelete ? (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                      onClick={applyBulkDelete}
                    >
                      Delete selected
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}

          {showFilters && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <FiFilter size={13} className="text-slate-500" />
              <span>Filters</span>
            </button>
          )}

          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              className="w-48 sm:w-64 border border-slate-300 rounded-md text-xs py-1.5 pl-3 pr-8 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <FiSearch className="absolute right-2.5 top-2.5 text-slate-400" size={13} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {extraHeaderActions}

          {showCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <FiPlus size={14} />
              <span>{createLabel}</span>
            </button>
          )}

          {showExport && (
            <button
              type="button"
              onClick={onExport}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <FiDownload size={13} className="text-slate-500" />
              <span>Export</span>
              <FiChevronDown size={12} className="text-slate-400" />
            </button>
          )}

          {showReload && (
            <button
              type="button"
              onClick={onReload}
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              title="Reload table"
            >
              <FiRefreshCw size={13} className="text-slate-500" />
              <span>Reload</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="w-10 px-3 py-2.5 text-center">
                <input
                  type="checkbox"
                  onChange={toggleSelectAll}
                  checked={selectedRows.length > 0 && selectedRows.length === data.length}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-3.5 py-2.5 ${col.className || ''}`}
                  style={{ width: col.width }}
                >
                  <div className="flex items-center gap-1 select-none">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-slate-400 text-[9px]">↕</span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-10 text-slate-400 font-normal"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const absoluteIdx = (currentPage - 1) * pageSize + rowIdx;
                const isSelected = selectedRows.includes(absoluteIdx);
                return (
                  <tr
                    key={row.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    <td
                      className="w-10 px-3 py-2.5 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(absoluteIdx)}
                        className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                    </td>
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-3.5 py-2.5 ${col.className || ''}`}>
                        {col.cell ? col.cell(row, rowIdx) : row[col.accessor]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-slate-300 rounded-md py-1 px-2 text-xs bg-white focus:outline-hidden"
          >
            <option value={10}>10</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={500}>500</option>
          </select>
          <span>
            {filteredData.length === 0
              ? 'No record'
              : `Show from ${(currentPage - 1) * pageSize + 1} to ${Math.min(
                  currentPage * pageSize,
                  filteredData.length
                )} in ${filteredData.length} records`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
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
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-slate-300 rounded-md text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next »
          </button>
        </div>
      </div>

      {statusModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-md shadow-xl w-full max-w-sm border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Bulk change status</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Apply to {selectedItems.length} selected record(s)
              </p>
            </div>
            <div className="p-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
              >
                {bulkStatusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyBulkStatus}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDataTable;
