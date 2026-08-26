'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface ChatShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
}

/** Responsive chat layout: static sidebar on desktop, animated drawer on mobile. */
export function ChatShell({ sidebar, header, children, sidebarOpen, onCloseSidebar }: ChatShellProps) {
  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-72 shrink-0 flex-col border-r border-border bg-surface">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseSidebar}
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface md:hidden"
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        {children}
      </div>
    </div>
  );
}
