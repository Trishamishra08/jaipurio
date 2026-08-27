import React, { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import AdminPageHeader from './AdminPageHeader';
import { useShop } from '../../context/ShopContext';

const AdminMedia = () => {
  const { products } = useShop();
  const [uploads, setUploads] = useState([]);

  const files = useMemo(() => {
    const productFiles = (products || [])
      .filter((p) => p.image)
      .map((p, index) => ({
        id: p._id || index,
        name: p.name,
        url: p.image,
        folder: 'products',
      }));
    return [...uploads, ...productFiles];
  }, [products, uploads]);

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setUploads((prev) => [{ id: Date.now(), name: file.name, url, folder: 'uploads' }, ...prev]);
  };

  return (
    <div>
      <AdminPageHeader
        title="Media"
        actionLabel="Upload"
        onAction={() => document.getElementById('admin-media-upload')?.click()}
      />
      <input id="admin-media-upload" type="file" accept="image/*" className="hidden" onChange={onUpload} />

      <div className="admin-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {files.map((file) => (
            <figure key={file.id} className="admin-media-tile">
              <img src={file.url} alt={file.name} />
              <figcaption>
                <strong>{file.name}</strong>
                <small>{file.folder}</small>
              </figcaption>
            </figure>
          ))}
          <label htmlFor="admin-media-upload" className="admin-media-upload">
            <Upload size={22} />
            Upload
          </label>
        </div>
      </div>
    </div>
  );
};

export default AdminMedia;
