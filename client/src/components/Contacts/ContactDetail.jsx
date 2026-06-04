import { useState, useEffect } from 'react';
import { useCreateContact, useUpdateContact, useDeleteContact } from '~/hooks/useContacts';

const CORE_FIELDS = [
  { key: 'name',    label: 'Name',    required: true },
  { key: 'company', label: 'Company', required: false },
  { key: 'role',    label: 'Role',    required: false },
  { key: 'email',   label: 'Email',   required: false, type: 'email' },
];

export default function ContactDetail({ contact, onClose, onSaved }) {
  const isNew = !contact;

  const [form, setForm] = useState({
    name: '', company: '', role: '', email: '', notes: '',
  });
  const [attrs, setAttrs] = useState([]); // [{ key: '', value: '' }]
  const [error, setError] = useState('');

  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // Populate form when editing an existing contact
  useEffect(() => {
    if (contact) {
      setForm({
        name:    contact.name    ?? '',
        company: contact.company ?? '',
        role:    contact.role    ?? '',
        email:   contact.email   ?? '',
        notes:   contact.notes   ?? '',
      });

      const rawAttrs = contact.attributes
        ? Object.entries(contact.attributes instanceof Map
            ? Object.fromEntries(contact.attributes)
            : contact.attributes)
        : [];
      setAttrs(rawAttrs.map(([key, value]) => ({ key, value })));
    }
  }, [contact]);

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    const attributes = Object.fromEntries(
      attrs.filter((a) => a.key.trim()).map((a) => [a.key.trim(), a.value])
    );
    const payload = { ...form, attributes };

    try {
      if (isNew) {
        await createContact.mutateAsync(payload);
      } else {
        await updateContact.mutateAsync({ id: contact._id, ...payload });
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to save contact.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact?')) return;
    await deleteContact.mutateAsync(contact._id);
    onSaved();
  };

  const addAttr = () => setAttrs([...attrs, { key: '', value: '' }]);
  const updateAttr = (i, field, val) => {
    const next = [...attrs];
    next[i][field] = val;
    setAttrs(next);
  };
  const removeAttr = (i) => setAttrs(attrs.filter((_, j) => j !== i));

  const isBusy = createContact.isLoading || updateContact.isLoading;

  return (
    <div className="absolute inset-0 bg-white dark:bg-gray-900 z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {isNew ? 'New contact' : 'Edit contact'}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Core fields */}
        {CORE_FIELDS.map(({ key, label, required, type = 'text' }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {label}{required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        ))}

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Notes
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Custom attributes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Custom attributes
            </label>
            <button
              onClick={addAttr}
              className="text-xs text-blue-500 hover:text-blue-600 hover:underline"
            >
              + Add field
            </button>
          </div>

          {attrs.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              No custom attributes. Add things like Industry, Location, Tags…
            </p>
          )}

          {attrs.map((attr, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="field name"
                value={attr.key}
                onChange={(e) => updateAttr(i, 'key', e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                placeholder="value"
                value={attr.value}
                onChange={(e) => updateAttr(i, 'value', e.target.value)}
                className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => removeAttr(i)}
                className="text-red-400 hover:text-red-600 px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="flex-1 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {isBusy ? 'Saving…' : 'Save contact'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full py-2 text-xs text-red-500 hover:text-red-700 hover:underline"
          >
            Delete contact
          </button>
        )}
      </div>
    </div>
  );
}
