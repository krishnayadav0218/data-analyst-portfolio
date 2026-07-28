import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search,
  Home,
  FolderKanban,
  Wrench,
  BookOpen,
  Mail,
  Download,
  MessageCircle,
  GitBranch,
  ExternalLink,
  Command,
} from 'lucide-react';

export default function CommandPalette({ profile }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const commands = useMemo(
    () => [
      { label: 'Home', hint: 'Back to the top', icon: Home, action: () => (window.location.hash = '#home') },
      { label: 'Projects', hint: 'Case studies', icon: FolderKanban, action: () => (window.location.hash = '#projects') },
      { label: 'Services', hint: 'What I offer', icon: Wrench, action: () => (window.location.hash = '#services') },
      { label: 'Skills', hint: 'Tools & proficiency', icon: Wrench, action: () => (window.location.hash = '#skills') },
      { label: 'Blog', hint: 'Articles', icon: BookOpen, action: () => (window.location.hash = '#blog') },
      { label: 'Contact', hint: 'Get in touch', icon: Mail, action: () => (window.location.hash = '#contact') },
      {
        label: 'Download resume',
        hint: 'Opens the PDF',
        icon: Download,
        action: () => window.open(profile?.resumeUrl || '/krishna-yadav-resume.pdf', '_blank'),
      },
      {
        label: 'WhatsApp',
        hint: 'Chat directly',
        icon: MessageCircle,
        action: () => window.open(`https://wa.me/${(profile?.phone || '').replace(/\D/g, '')}`, '_blank'),
      },
      { label: 'GitHub', hint: 'Code & repos', icon: GitBranch, action: () => window.open(profile?.github, '_blank') },
      { label: 'LinkedIn', hint: 'Professional profile', icon: ExternalLink, action: () => window.open(profile?.linkedin, '_blank') },
    ],
    [profile]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const isToggle = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isToggle) {
        event.preventDefault();
        setOpen((v) => !v);
      } else if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const run = (command) => {
    command.action();
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="command-palette-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
        title="Quick navigation (Ctrl+K)"
      >
        <Command size={16} /> <span>Ctrl K</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="command-palette-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="command-palette"
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="command-palette-input">
                <Search size={18} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Jump to a section or action…"
                  aria-label="Command palette search"
                />
                <kbd>Esc</kbd>
              </div>
              <div className="command-palette-list">
                {filtered.length === 0 && <p className="command-palette-empty">No matches.</p>}
                {filtered.map((command) => (
                  <button key={command.label} type="button" onClick={() => run(command)}>
                    <command.icon size={17} />
                    <span>{command.label}</span>
                    <small>{command.hint}</small>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
