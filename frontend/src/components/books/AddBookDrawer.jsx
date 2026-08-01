import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AddBook } from './AddBook';
import { AddBookByISBN } from './AddBookByISBN';

export function AddBookDrawer({ open, onClose, onAddManual, onAddByIsbn, isSubmitting }) {
  const [tab, setTab] = useState('manual');

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink/40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-surface p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-medium text-ink">Add a book</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted hover:bg-paper-dim hover:text-ink"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex gap-2 rounded-full bg-paper-dim p-1">
              <button
                onClick={() => setTab('manual')}
                className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                  tab === 'manual' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                Enter manually
              </button>
              <button
                onClick={() => setTab('isbn')}
                className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-colors ${
                  tab === 'isbn' ? 'bg-surface text-ink shadow-sm' : 'text-muted'
                }`}
              >
                Look up by ISBN
              </button>
            </div>

            <div className="mt-6">
              {tab === 'manual' ? (
                <AddBook onSubmit={onAddManual} isSubmitting={isSubmitting} />
              ) : (
                <AddBookByISBN onSubmit={onAddByIsbn} isSubmitting={isSubmitting} />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
