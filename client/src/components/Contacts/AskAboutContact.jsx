/**
 * AskAboutContact
 * A button you can place on a ContactDetail view.
 * Clicking it sends a pre-filled message to the LibreChat chat window:
 *   "Tell me everything we know about [Name] from [Company]"
 *
 * Usage:
 *   <AskAboutContact contact={contact} />
 */
export default function AskAboutContact({ contact }) {
  const handleAsk = () => {
    const parts = [`Tell me everything we know about ${contact.name}`];
    if (contact.company) parts.push(`from ${contact.company}`);
    const message = parts.join(' ');

    // LibreChat exposes a global event bus — dispatch a custom event
    // that the chat input listens for (wire this up in your chat input component)
    window.dispatchEvent(
      new CustomEvent('librechat:prefill-message', { detail: { message } })
    );

    // Alternatively, if you have access to a setInput callback, use that directly:
    // setInput(message);
  };

  return (
    <button
      onClick={handleAsk}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
    >
      <span>💬</span>
      Ask AI about this contact
    </button>
  );
}
