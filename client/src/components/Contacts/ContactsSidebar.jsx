import { useState } from 'react';
import { useContacts } from '~/hooks/useContacts';
import ContactsList from './ContactsList';
import ContactDetail from './ContactDetail';
import ContactImport from './ContactImport';

export default function ContactsSidebar({ isOpen, onClose }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // null | 'new' | contact object
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading, refetch } = useContacts({ search, page });
  const contacts = data?.contacts ?? [];
  const total = data?.total ?? 0;

  const handleSelect = (contact) => setSelected(contact);
  const handleClose = () => {
    setSelected(null);
  };
  const handleSaved = () => {
    setSelected(null);
    refetch();
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-80 shadow-lg">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Contacts{total > 0 ? ` (${total.toLocaleString()})` : ''}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            title="Import CSV"
            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            Import
          </button>
          <button
            onClick={() => setSelected('new')}
            className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            + Add
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, company, role…"
          className="w-full text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-sm text-gray-400">Loading…</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-6">
            <p className="text-sm text-gray-400">
              {search ? 'No contacts match your search.' : 'No contacts yet.'}
            </p>
            {!search && (
              <button
                onClick={() => setSelected('new')}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Add your first contact
              </button>
            )}
          </div>
        ) : (
          <ContactsList
            contacts={contacts}
            selectedId={selected?._id}
            onSelect={handleSelect}
          />
        )}
      </div>

      {/* ── Pagination ── */}
      {total > 50 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="disabled:opacity-30 hover:text-gray-800 dark:hover:text-gray-200"
          >
            ← Prev
          </button>
          <span>
            {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total.toLocaleString()}
          </span>
          <button
            disabled={page * 50 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="disabled:opacity-30 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Next →
          </button>
        </div>
      )}

      {/* ── Detail drawer (overlays sidebar) ── */}
      {selected && (
        <ContactDetail
          contact={selected === 'new' ? null : selected}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}

      {/* ── Import modal ── */}
      {showImport && (
        <ContactImport
          onClose={() => setShowImport(false)}
          onImported={() => { setShowImport(false); refetch(); }}
        />
      )}
    </div>
  );
}
