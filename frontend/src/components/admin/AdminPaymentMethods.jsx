import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCreditCard, FiPlus, FiTrash2, FiX, FiTruck, FiHome } from 'react-icons/fi';
import { SiStripe, SiPaypal, SiRazorpay } from 'react-icons/si';
import AdminPageHeader from './AdminPageHeader';
import AdminCkEditor from './ecommerce/AdminCkEditor';
import {
  fetchPaymentMethods,
  fetchAvailableGateways,
  fetchCountries,
  addPaymentMethod,
  togglePaymentMethod,
  setDefaultPaymentMethod,
  savePaymentMethodConfig,
  deletePaymentMethod,
} from '../../utils/paymentMethodsApi';

const GATEWAY_ICONS = {
  razorpay: { Icon: SiRazorpay, color: '#0C2451', bg: '#EEF1F9' },
  stripe: { Icon: SiStripe, color: '#635BFF', bg: '#F1F0FE' },
  paypal: { Icon: SiPaypal, color: '#003087', bg: '#EAF1FB' },
  cod: { Icon: FiTruck, color: '#B45309', bg: '#FEF3E2' },
  bank_transfer: { Icon: FiHome, color: '#0F766E', bg: '#ECFDF5' },
  paystack: { Icon: FiCreditCard, color: '#00C3F7', bg: '#E6FAFF' },
};

const MethodIcon = ({ code }) => {
  const entry = GATEWAY_ICONS[code];
  if (!entry) {
    return (
      <span className="w-9 h-9 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
        <FiCreditCard size={16} />
      </span>
    );
  }
  const { Icon, color, bg } = entry;
  return (
    <span
      className="w-9 h-9 rounded-md border border-slate-200 flex items-center justify-center shrink-0"
      style={{ backgroundColor: bg, color }}
    >
      <Icon size={17} />
    </span>
  );
};

const AddGatewayModal = ({ available, onClose, onAdded }) => {
  const [busyCode, setBusyCode] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async (code) => {
    setBusyCode(code);
    setError('');
    try {
      const created = await addPaymentMethod(code);
      onAdded(created);
      onClose();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to add payment method.');
    } finally {
      setBusyCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-md shadow-xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Add a payment method</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>
        {error && (
          <div className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}
        {available.length === 0 ? (
          <p className="text-xs text-slate-500">Every available payment gateway has already been added.</p>
        ) : (
          <div className="space-y-2">
            {available.map((g) => (
              <button
                key={g.code}
                type="button"
                onClick={() => handleAdd(g.code)}
                disabled={busyCode === g.code}
                className="w-full flex items-center justify-between border border-slate-200 rounded-md px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <span className="flex items-center gap-2.5">
                  <MethodIcon code={g.code} />
                  <span className="text-xs font-semibold text-slate-800">{g.name}</span>
                </span>
                <span className="text-[11px] text-blue-600">{busyCode === g.code ? 'Adding…' : 'Add'}</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
          Need a gateway that isn't listed? A developer can register a new one in
          <code className="mx-1 px-1 py-0.5 bg-slate-100 rounded">backend/services/paymentGateways/</code>
          and it will appear here automatically.
        </p>
      </div>
    </div>
  );
};

const MethodRow = ({ method, countries, onToggle, onDelete, onSaved }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(method.name || '');
  const [instructions, setInstructions] = useState(method.instructions || '');
  const [minOrderAmount, setMinOrderAmount] = useState(method.minOrderAmount || 0);
  const [allCountries, setAllCountries] = useState(method.allCountries !== false);
  const [selectedCountries, setSelectedCountries] = useState(method.countries || []);
  const [config, setConfig] = useState(() => ({ ...(method.config || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleCountry = (code) => {
    setSelectedCountries((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await savePaymentMethodConfig(method.id, {
        name,
        instructions,
        minOrderAmount,
        allCountries,
        countries: allCountries ? [] : selectedCountries,
        config,
      });
      onSaved(saved);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <MethodIcon code={method.code} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-blue-600">{method.name}</span>
              {method.isDefault && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Default
                </span>
              )}
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  method.configFields?.length
                    ? method.hasConfig
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200'
                }`}
              >
                {method.configFields?.length ? (method.hasConfig ? 'Configured' : 'Needs configuration') : 'No setup needed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {method.description || `Customer can pay directly via ${method.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={method.isEnabled}
            onClick={() => onToggle(method)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              method.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                method.isEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md px-2.5 py-1.5 hover:bg-slate-50"
          >
            Settings {open ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-slate-50/60 p-4 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {error}
            </div>
          )}

          {(method.configFields || []).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Gateway credentials</h4>
              {method.configFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">{field.label}</label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={config[field.key] || ''}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.secret ? 'Leave unchanged to keep existing value' : ''}
                    className="w-full border border-slate-300 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Method name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <AdminCkEditor
            label="Payment guide — shown on the order-success / payment page"
            value={instructions}
            onChange={setInstructions}
            minHeight={140}
            placeholder="Instructions shown to the customer for this payment method..."
          />

          <div className="bg-white border border-slate-200 rounded-md p-3">
            <h4 className="text-xs font-bold text-slate-700 mb-1">Available countries</h4>
            <p className="text-[11px] text-slate-400 mb-2">Choose the countries where this payment method is available.</p>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer mb-2">
              <input type="checkbox" checked={allCountries} onChange={(e) => setAllCountries(e.target.checked)} />
              All
            </label>
            {!allCountries && (
              <div className="max-h-56 overflow-y-auto border border-slate-100 rounded-md p-2 space-y-1">
                {countries.map((c) => (
                  <label key={c.code} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={selectedCountries.includes(c.code)}
                      onChange={() => toggleCountry(c.code)}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Minimum order amount — INR (Optional)</label>
            <input
              type="number"
              min="0"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(Number(e.target.value) || 0)}
              className="w-full max-w-xs border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => onDelete(method)}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-700"
            >
              <FiTrash2 size={13} /> Remove method
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(method)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-white"
              >
                {method.isEnabled ? 'Deactivate' : 'Activate'}
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={saving}
                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white"
              >
                {saving ? 'Saving…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [available, setAvailable] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [defaultId, setDefaultId] = useState('');
  const [savingDefault, setSavingDefault] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, avail, countryRows] = await Promise.all([
        fetchPaymentMethods(),
        fetchAvailableGateways(),
        fetchCountries(),
      ]);
      setMethods(rows);
      setAvailable(avail);
      setCountries(countryRows);
      const current = rows.find((m) => m.isDefault) || rows.find((m) => m.isEnabled);
      if (current) setDefaultId(current.id);
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to load payment methods.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const enabledMethods = useMemo(() => methods.filter((m) => m.isEnabled), [methods]);

  const handleSaveDefault = async () => {
    if (!defaultId) return;
    setSavingDefault(true);
    setError('');
    try {
      await setDefaultPaymentMethod(defaultId);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to save default method.');
    } finally {
      setSavingDefault(false);
    }
  };

  const handleToggle = async (method) => {
    try {
      await togglePaymentMethod(method.id, !method.isEnabled);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to toggle payment method.');
    }
  };

  const handleDelete = async (method) => {
    if (!window.confirm(`Remove "${method.name}"? This cannot be undone.`)) return;
    try {
      await deletePaymentMethod(method.id);
      await load();
    } catch (err) {
      setError(err.parsedMessage || err.message || 'Failed to remove payment method.');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Payment methods" />
      <p className="text-xs text-slate-500 -mt-3 mb-4">Setup payment methods for website</p>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : (
        <>
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-4 mb-5 space-y-3 max-w-lg">
            <label className="block text-xs font-bold text-slate-700">Default payment method</label>
            <select
              value={defaultId}
              onChange={(e) => setDefaultId(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs bg-white focus:outline-hidden focus:border-blue-500"
            >
              {enabledMethods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSaveDefault}
              disabled={savingDefault}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-black disabled:opacity-60 text-white"
            >
              {savingDefault ? 'Saving…' : 'Save settings'}
            </button>
          </div>

          <div className="space-y-3">
            {methods.map((method) => (
              <MethodRow
                key={method.id}
                method={method}
                countries={countries}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onSaved={() => load()}
              />
            ))}

            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-slate-200 rounded-md py-3 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <FiPlus size={14} />
              Add payment method
            </button>
          </div>
        </>
      )}

      {addOpen && (
        <AddGatewayModal
          available={available}
          onClose={() => setAddOpen(false)}
          onAdded={() => load()}
        />
      )}
    </div>
  );
};

export default AdminPaymentMethods;
