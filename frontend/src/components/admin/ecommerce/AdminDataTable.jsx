import React, { useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiDownload,
  FiRefreshCw,
  FiChevronDown,
  FiCalendar,
  FiFilter,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye
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
  extraHeaderActions,
  emptyMessage = 'No data to display',
  onRowClick
}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(data.map((_, i) => i));
    } else {
      setSelectedRows([]);
    }
  };

  const toggleSelectRow = (index) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter(i => i !== index));
    } else {
      setSelectedRows([...selectedRows, index]);
    }
  };

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs">
      {/* Top Action Bar */}
      <div className="p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {showBulkActions && (
            <div className="relative inline-block">
              <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                <span>Bulk Actions</span>
                <FiChevronDown size={13} className="text-slate-500" />
              </button>
            </div>
          )}

          {showFilters && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
              <FiFilter size={13} className="text-slate-500" />
              <span>Filters</span>
            </button>
          )}

          {/* Search Box */}
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

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {extraHeaderActions}

          {showCreate && (
            <button
              onClick={onCreate}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <FiPlus size={14} />
              <span>{createLabel}</span>
            </button>
          )}

          {showExport && (
            <button
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

      {/* Table Container */}
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
                <td colSpan={columns.length + 1} className="text-center py-10 text-slate-400 font-normal">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const isSelected = selectedRows.includes(rowIdx);
                return (
                  <tr
                    key={row.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    } ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    <td className="w-10 px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowIdx)}
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

      {/* Bottom Pagination & Records count */}
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
              : `Show from ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredData.length)} in ${filteredData.length} records`}
          </span>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1 border border-slate-300 rounded-md text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            « Previous
          </button>
          <span className="px-2.5 py-1 bg-blue-600 text-white rounded-md text-xs font-semibold">
            {currentPage}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 border border-slate-300 rounded-md text-xs hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next »
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDataTable;
