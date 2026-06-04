import { useRef, useState } from 'react';
import { useImportContacts } from '~/hooks/useContacts';

export default function ContactImport({ onClose, onImported }) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const importContacts = useImportContacts();

  const pickFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    fileRef.current = file;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => pickFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!fileRef.current) return;
    try {
      const result = await importContacts.mutateAsync(fileRef.current);
      onImported(result);
    } catch (e) {
      // error shown via importContacts.error
    }
  };

  const isDone = importContacts.isSuccess;
  const isError = importContacts.isError;
  const isBusy = importContacts.isLoading;
  const result = importContacts.data;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-96 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Import contacts from CSV
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Format hint */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
            Expected CSV columns (header row required):
          </p>
          <code className="text-xs text-blue-600 dark:text-blue-400">
            name, company, role, email, notes
          </code>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
            Any extra columns automatically become custom attributes.
          </p>
        </div>

        {/* Drop zone */}
        {!isDone && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl px-6 py-8 text-center cursor-pointer transition-colors mb-4 ${
              dragOver
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => document.getElementById('csv-file-input').click()}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fileName ? (
                <span className="text-gray-900 dark:text-gray-100 font-medium">{fileName}</span>
              ) : (
                <>
                  Drop your CSV here, or{' '}
                  <span className="text-blue-500 underline">browse</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">Supports files up to 200 MB</p>
          </div>
        )}

        <input
          id="csv-file-input"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileInput}
        />

        {/* Result */}
        {isDone && result && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">
              ✓ Import complete
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {result.inserted.toLocaleString()} contacts imported
              {result.errors > 0 ? `, ${result.errors} skipped` : ''}.
            </p>
          </div>
        )}

        {isError && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-red-600 dark:text-red-400">
              Upload failed. Please check your CSV format and try again.
            </p>
          </div>
        )}

        {/* Progress bar while uploading */}
        {isBusy && (
          <div className="mb-4">
            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-center">Uploading and processing…</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {isDone ? (
            <button
              onClick={onImported}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              Done
            </button>
          ) : (
            <button
              onClick={handleUpload}
              disabled={!fileName || isBusy}
              className="flex-1 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-40 transition-colors"
            >
              {isBusy ? 'Uploading…' : 'Import'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
