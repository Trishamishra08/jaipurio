import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiCheck, FiLogOut, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { fetchContact, updateContact, replyToContact } from '../../utils/contactsApi';

const Breadcrumb = ({ items }) => (
  <nav className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-1.5">
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-slate-300">/</span>}
        {item}
      </React.Fragment>
    ))}
  </nav>
);

const AdminContactEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [contact, setContact] = useState(null);
  const [status, setStatus] = useState('Unread');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedToast, setSavedToast] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchContact(id);
      setContact(data);
      setStatus(data.status || 'Unread');
    } catch (err) {
      setLoadError(err.parsedMessage || err.message || 'Failed to load contact.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async (exit = false) => {
    setSaving(true);
    setSaveError('');
    try {
      await updateContact(id, { status });
      setSavedToast(true);
      window.setTimeout(() => setSavedToast(false), 1800);
      if (exit) navigate('/admin/contacts');
    } catch (err) {
      setSaveError(err.parsedMessage || err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplying(true);
    setReplyError('');
    try {
      const updated = await replyToContact(id, replyText.trim());
      setContact(updated);
      setStatus(updated.status || 'Read');
      setReplyText('');
    } catch (err) {
      setReplyError(err.parsedMessage || err.message || 'Failed to send reply.');
    } finally {
      setReplying(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumb items={['CONTACT', 'VIEW CONTACT']} />
        <div className="text-center text-xs text-slate-400 py-10">Loading…</div>
      </div>
    );
  }

  if (loadError || !contact) {
    return (
      <div>
        <Breadcrumb items={['CONTACT', 'VIEW CONTACT']} />
        <div className="px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {loadError || 'Contact not found.'}
        </div>
      </div>
    );
  }

  const customFieldEntries = contact.fields && typeof contact.fields === 'object' ? Object.entries(contact.fields) : [];

  return (
    <div>
      <Breadcrumb
        items={[
          <Link key="1" to="/admin/contacts" className="hover:underline">CONTACT</Link>,
          'VIEW CONTACT',
        ]}
      />
      {savedToast && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-md shadow-lg flex items-center gap-2">
          <FiCheck size={16} />
          <span>Saved successfully!</span>
        </div>
      )}
      {(saveError || replyError) && (
        <div className="mb-4 px-3 py-2 rounded-md bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
          {saveError || replyError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-4 sm:p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-4">Contact information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Full Name</div>
                <div className="text-slate-800 font-medium">{contact.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Email</div>
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                  <FiMail size={11} /> {contact.email}
                </a>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Phone</div>
                {contact.phone ? (
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <FiPhone size={11} /> {contact.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Time</div>
                <div className="text-slate-700">{contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '—'}</div>
              </div>
              {customFieldEntries.map(([key, value]) => (
                <div key={key}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{key}</div>
                  <div className="text-slate-700">{String(value) || '—'}</div>
                </div>
              ))}
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subject</div>
                <div className="text-slate-700">{contact.subject || '—'}</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Content</div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
            </div>
          </div>

          <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-4 sm:p-5 space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Replies</h4>
            {(contact.replies || []).length === 0 ? (
              <p className="text-xs text-slate-400">No reply yet!</p>
            ) : (
              <div className="space-y-3">
                {contact.replies.map((r, i) => (
                  <div key={r._id || i} className="border border-slate-100 rounded-md p-3 bg-slate-50/60">
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{r.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {r.repliedByName || 'Admin'} · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                      {r.emailSent ? (
                        <span className="ml-1.5 text-emerald-600 font-semibold">· Emailed</span>
                      ) : (
                        <span className="ml-1.5 text-amber-600 font-semibold">· Not emailed (SMTP not configured)</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder="Write a reply…"
              className="w-full border border-slate-300 rounded-md py-2 px-3 text-xs focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-y"
            />
            <button
              type="button"
              onClick={handleReply}
              disabled={replying || !replyText.trim()}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white"
            >
              {replying ? 'Sending…' : 'Reply'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Publish</h4>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-900 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-md text-xs shadow-xs transition"
            >
              <FiSave size={14} />
              Save
            </button>
            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60 text-slate-800 font-semibold py-2 px-3 rounded-md text-xs transition"
            >
              <FiLogOut size={14} />
              Save & Exit
            </button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Status<span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-1.5 px-3 text-xs bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="Read">Read</option>
              <option value="Unread">Unread</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactEdit;
