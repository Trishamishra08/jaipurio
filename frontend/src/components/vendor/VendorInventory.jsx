import React, { useEffect, useState } from 'react';
import VendorPage from './VendorPage';
import { fetchInventory, restockProduct } from '../../utils/marketplaceApi';

const VendorInventory = () => {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    fetchInventory().then((rows) => setItems(Array.isArray(rows) ? rows : []));
  }, []);

  const saveStock = async (id) => {
    const item = items.find((row) => (row._id || row.id) === id);
    const stock = Number(draft[id] ?? item.stock);
    const saved = await restockProduct(id, stock, item.warehouse);
    setItems((prev) => prev.map((row) => ((row._id || row.id) === id ? { ...row, ...saved, stock } : row)));
  };

  const low = items.filter((i) => i.trackQuantity && Number(i.stock) > 0 && Number(i.stock) < 8).length;
  const out = items.filter((i) => i.stockStatus === 'Out of Stock').length;

  return (
    <VendorPage
      title="Inventory"
      hint="Warehouse-level stock. If Track Quantity is on and stock hits 0, status becomes Out of Stock automatically. Product can stay Published."
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="admin-mini-card admin-mini-mint"><strong>{items.length}</strong><span>SKUs</span></div>
        <div className="admin-mini-card admin-mini-peach"><strong>{low}</strong><span>Low-stock alerts</span></div>
        <div className="admin-mini-card admin-mini-lilac"><strong>{out}</strong><span>Out of stock</span></div>
      </div>
      <div className="admin-card overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Title</th>
              <th>Warehouse</th>
              <th>Track qty</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id || item.id}>
                <td>{item.sku}</td>
                <td>{item.title}</td>
                <td>{item.warehouse}</td>
                <td>{item.trackQuantity ? 'On' : 'Off'}</td>
                <td>
                  <input
                    className="admin-input w-20"
                    type="number"
                    value={draft[item._id || item.id] ?? item.stock}
                    onChange={(e) => setDraft((p) => ({ ...p, [item._id || item.id]: e.target.value }))}
                  />
                </td>
                <td><span className={`admin-badge ${item.stockStatus === 'Out of Stock' ? 'admin-badge-danger' : 'admin-badge-success'}`}>{item.stockStatus}</span></td>
                <td className="text-right"><button type="button" className="admin-btn-primary" onClick={() => saveStock(item._id || item.id)}>Restock</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VendorPage>
  );
};

export default VendorInventory;
