export default function ContactsList({ contacts, selectedId, onSelect }) {
  return (
    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
      {contacts.map((contact) => (
        <li key={contact._id}>
          <button
            onClick={() => onSelect(contact)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
              selectedId === contact._id
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Avatar initial */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-300">
                {contact.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {contact.name}
                </p>
                {(contact.role || contact.company) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[contact.role, contact.company].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
