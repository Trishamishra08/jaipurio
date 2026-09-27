import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiChevronRight,
  FiFilter,
  FiX,
  FiFileText,
} from 'react-icons/fi';

const FILTER_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Is equal to' },
  { value: 'gt', label: 'Greater than' },
  { value: 'lt', label: 'Less than' },
];

const emptyFilterRow = (defaultField) => ({ field: defaultField || '', operator: 'equals', value: '' });

const matchesFilter = (row, filter, fieldMeta) => {
  if (!filter.field || filter.value === '' || filter.value == null) return true;
  const raw = row[filter.field];
  const isDate = fieldMeta?.type === 'date';
  const isNumber = fieldMeta?.type === 'number';

  if (filter.operator === 'contains') {
    return String(raw ?? '').toLowerCase().includes(String(filter.value).toLowerCase());
  }
  if (filter.operator === 'equals') {
    if (isDate) {
      const a = raw ? new Date(raw).toISOString().slice(0, 10) : '';
      return a === filter.value;
    }
    return String(raw ?? '').toLowerCase() === String(filter.value).toLowerCase();
  }
  // gt / lt — numeric or date comparison
  const a = isDate ? Date.parse(raw) : Number(raw);
  const b = isDate ? Date.parse(filter.value) : Number(filter.value);
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  return filter.operator === 'gt' ? a > b : a < b;
};

export const AdminDataTable = ({
  title,
  columns = [],
  data = [],
  searchPlaceholder = 'Search...',
  onSearch,
  onCreate,
  createLabel = 'Create',
  onExport,
  onExportCsv,
  onExportExcel,
  onReload,
  showCreate = true,
  showExport = true,
  showReload = true,
  showBulkActions = true,
  showFilters = true,
  filterFields,
  bulkStatusOptions = ['Published', 'Pending', 'Draft'],
  onBulkStatusChange,
  onBulkDelete,
  extraHeaderActions,
  emptyMessage = 'No data to display',
  onRowClick,
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterRows, setFilterRows] = useState([emptyFilterRow()]);
  const [appliedFilters, setAppliedFilters] = useState([]);

  const availableFields = useMemo(() => {
    if (filterFields && filterFields.length) return filterFields;
    return columns
      .filter((c) => c.accessor)
      .map((c) => ({ key: c.accessor, label: c.header, type: c.filterType || 'text' }));
  }, [filterFields, columns]);

  const fieldMetaByKey = useMemo(
    () => Object.fromEntries(availableFields.map((f) => [f.key, f])),
    [availableFields]
  );
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkChangesOpen, setBulkChangesOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(bulkStatusOptions[0] || '');
  const [exportOpen, setExportOpen] = useState(false);
  const bulkRef = useRef(null);
  const exportRef = useRef(null);
  const hasExportFormats = Boolean(onExportCsv || onExportExcel);

  useEffect(() => {
    const onDocClick = (e) => {
      if (bulkRef.current && !bulkRef.current.contains(e.target)) {
        setBulkOpen(false);
        setBulkChangesOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
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
    if (searchTerm) {
      const matchesSearch = Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchesSearch) return false;
    }
    return appliedFilters.every((filter) => matchesFilter(item, filter, fieldMetaByKey[filter.field]));
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

  const updateFilterRow = (index, patch) => {
    setFilterRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addFilterRow = () => setFilterRows((rows) => [...rows, emptyFilterRow()]);

  const applyFilters = () => {
    setAppliedFilters(filterRows.filter((r) => r.field && r.value !== ''));
  };

  const closeFilters = () => {
    setFiltersOpen(false);
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs relative">
      {showFilters && filtersOpen && (
        <div className="p-4 border-b border-slate-200 bg-slate-50/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800">Filters</h4>
            <button type="button" onClick={closeFilters} className="text-slate-400 hover:text-slate-700">
              <FiX size={16} />
            </button>
          </div>
          <div className="space-y-2.5">
            {filterRows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={row.field}
                  onChange={(e) => updateFilterRow(index, { field: e.target.value })}
                  className="border border-slate-300 rounded-md text-xs py-1.5 px-2.5 bg-white focus:outline-hidden focus:border-blue-500 min-w-[150px]"
                >
                  <option value="">Select field</option>
                  {availableFields.map((f) => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={row.operator}
                  onChange={(e) => updateFilterRow(index, { operator: e.target.value })}
                  className="border border-slate-300 rounded-md text-xs py-1.5 px-2.5 bg-white focus:outline-hidden focus:border-blue-500 min-w-[130px]"
                >
                  {FILTER_OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <input
                  type={fieldMetaByKey[row.field]?.type === 'date' ? 'date' : fieldMetaByKey[row.field]?.type === 'number' ? 'number' : 'text'}
                  value={row.value}
                  onChange={(e) => updateFilterRow(index, { value: e.target.value })}
                  placeholder="Value"
                  className="border border-slate-300 rounded-md text-xs py-1.5 px-2.5 focus:outline-hidden focus:border-blue-500 min-w-[150px]"
                />
                {filterRows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setFilterRows((rows) => rows.filter((_, i) => i !== index))}
                    className="text-slate-400 hover:text-rose-600"
                    title="Remove filter"
                  >
                    <FiX size={15} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={addFilterRow}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Add additional filter
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition"
              >
                Apply
              </button>
              {appliedFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterRows([emptyFilterRow()]);
                    setAppliedFilters([]);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
              onClick={() => setFiltersOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-xs font-medium transition ${
                appliedFilters.length ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FiFilter size={13} className={appliedFilters.length ? 'text-blue-600' : 'text-slate-500'} />
              <span>Filters</span>
              {appliedFilters.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {appliedFilters.length}
                </span>
              )}
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

          {showExport && hasExportFormats && (
            <div className="relative inline-block" ref={exportRef}>
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <FiDownload size={13} className="text-slate-500" />
                <span>Export</span>
                <FiChevronDown size={12} className="text-slate-400" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full mt-1 z-40 min-w-[140px] bg-white border border-slate-200 rounded-md shadow-lg py-1">
                  {onExportCsv && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => { setExportOpen(false); onExportCsv(); }}
                    >
                      <FiFileText size={13} className="text-emerald-600" /> CSV
                    </button>
                  )}
                  {onExportExcel && (
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                      onClick={() => { setExportOpen(false); onExportExcel(); }}
                    >
                      <FiFileText size={13} className="text-blue-600" /> Excel
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {showExport && !hasExportFormats && (
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
                  <div className={`flex items-center gap-1 select-none ${col.className?.includes('text-center') ? 'justify-center' : ''} ${col.className?.includes('text-right') ? 'justify-end' : ''}`}>
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
