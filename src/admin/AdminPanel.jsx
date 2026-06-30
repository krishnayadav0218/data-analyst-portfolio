import { useState, useEffect, useCallback } from 'react';
import {
  Lock, LayoutDashboard, User, Wrench, FolderKanban,
  Briefcase, Mail, LogOut, Plus, Trash2, Save, CheckCircle2,
  AlertCircle, Loader2, X
} from 'lucide-react';
import './AdminPanel.css';

// Point this at wherever your Express server actually runs.
// In local dev that's usually http://localhost:5000
// In production, set VITE_API_BASE in your .env file.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export default function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken) => {
    localStorage.setItem('admin_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken('');
  };

  if (!authChecked) return null;

  return token ? (
    <Dashboard token={token} onLogout={handleLogout} />
  ) : (
    <LoginScreen onLogin={handleLogin} />
  );
}

// ==========================================================
// LOGIN SCREEN
// ==========================================================
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }
      onLogin(data.token);
    } catch (err) {
      setError('Could not reach the server. Is the backend running?');
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-screen">
      <div className="admin-login-grid" />
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-icon">
          <Lock size={22} strokeWidth={2} />
        </div>
        <h1>Admin Access</h1>
        <p className="admin-login-sub">Sign in to manage your portfolio content.</p>

        <label className="admin-field-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="admin-input"
        />

        {error && (
          <div className="admin-error">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="admin-btn-primary" disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
          {loading ? 'Checking…' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

// ==========================================================
// DASHBOARD SHELL
// ==========================================================
const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'messages', label: 'Contact', icon: Mail },
];

function Dashboard({ token, onLogout }) {
  const [active, setActive] = useState('profile');
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const authedFetch = useCallback((url, options = {}) => {
    return fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  }, [token]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2800);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dataRes, msgRes] = await Promise.all([
        authedFetch('/api/admin/data'),
        authedFetch('/api/admin/messages')
      ]);
      if (dataRes.status === 401 || msgRes.status === 401) {
        onLogout();
        return;
      }
      setData(await dataRes.json());
      setMessages(await msgRes.json());
    } catch (err) {
      showToast('Could not load data from server.', 'error');
    } finally {
      setLoading(false);
    }
  }, [authedFetch, onLogout]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveSection(section, payload) {
    try {
      const res = await authedFetch(`/api/admin/${section}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.status === 401) { onLogout(); return; }
      if (!res.ok) throw new Error();
      setData((prev) => ({ ...prev, [section]: payload }));
      showToast('Saved successfully.');
    } catch {
      showToast('Save failed. Check your connection.', 'error');
    }
  }

  async function deleteMessage(id) {
    try {
      const res = await authedFetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(id)));
      showToast('Message deleted.');
    } catch {
      showToast('Could not delete message.', 'error');
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <LayoutDashboard size={18} />
          <span>Portfolio Admin</span>
        </div>
        <nav className="admin-nav">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`admin-nav-item ${active === tab.id ? 'active' : ''}`}
                onClick={() => setActive(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.id === 'messages' && messages.length > 0 && (
                  <span className="admin-badge">{messages.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <button className="admin-logout" onClick={onLogout}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </aside>

      <main className="admin-main">
        {loading || !data ? (
          <div className="admin-loading"><Loader2 size={22} className="spin" /></div>
        ) : (
          <>
            {active === 'profile' && (
              <ProfileTab profile={data.profile} onSave={(p) => saveSection('profile', p)} />
            )}
            {active === 'skills' && (
              <SkillsTab skills={data.skills} onSave={(s) => saveSection('skills', s)} />
            )}
            {active === 'projects' && (
              <ProjectsTab projects={data.projects} onSave={(p) => saveSection('projects', p)} />
            )}
            {active === 'experience' && (
              <ExperienceTab experience={data.experience} onSave={(e) => saveSection('experience', e)} />
            )}
            {active === 'messages' && (
              <MessagesTab messages={messages} onDelete={deleteMessage} />
            )}
          </>
        )}
      </main>

      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ==========================================================
// PROFILE TAB
// ==========================================================
function ProfileTab({ profile, onSave }) {
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setSocial = (key, value) =>
    setForm((f) => ({ ...f, social: { ...(f.social || {}), [key]: value } }));

  return (
    <Section title="Profile" subtitle="Your name, headline, and contact details shown across the site.">
      <div className="admin-grid-2">
        <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} />
        <Field label="Title / Role" value={form.title} onChange={(v) => set('title', v)} />
      </div>
      <Field label="Short Bio" textarea value={form.bio} onChange={(v) => set('bio', v)} />
      <div className="admin-grid-2">
        <Field label="Email" value={form.email} onChange={(v) => set('email', v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
      </div>
      <div className="admin-grid-2">
        <Field label="Location" value={form.location} onChange={(v) => set('location', v)} />
        <Field label="Resume URL" value={form.resumeUrl} onChange={(v) => set('resumeUrl', v)} />
      </div>
      <Field label="Avatar Image URL" value={form.avatarUrl} onChange={(v) => set('avatarUrl', v)} />

      <h3 className="admin-subhead">Social Links</h3>
      <div className="admin-grid-3">
        <Field label="GitHub" value={form.social?.github} onChange={(v) => setSocial('github', v)} />
        <Field label="LinkedIn" value={form.social?.linkedin} onChange={(v) => setSocial('linkedin', v)} />
        <Field label="Twitter / X" value={form.social?.twitter} onChange={(v) => setSocial('twitter', v)} />
      </div>

      <SaveButton onClick={() => onSave(form)} />
    </Section>
  );
}

// ==========================================================
// SKILLS TAB  (categories, each with a list of items)
// ==========================================================
function SkillsTab({ skills, onSave }) {
  const [list, setList] = useState(skills || []);
  useEffect(() => setList(skills || []), [skills]);

  const addCategory = () => setList((l) => [...l, { category: 'New Category', items: [] }]);
  const removeCategory = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const updateCategory = (i, value) =>
    setList((l) => l.map((c, idx) => (idx === i ? { ...c, category: value } : c)));
  const updateItems = (i, value) =>
    setList((l) => l.map((c, idx) => (idx === i ? { ...c, items: value.split(',').map(s => s.trim()).filter(Boolean) } : c)));

  return (
    <Section title="Skills" subtitle="Group your skills into categories (e.g. Tools, Languages, Concepts).">
      {list.map((cat, i) => (
        <div className="admin-card" key={i}>
          <div className="admin-card-row">
            <Field label="Category Name" value={cat.category} onChange={(v) => updateCategory(i, v)} />
            <button className="admin-icon-btn danger" onClick={() => removeCategory(i)} title="Remove category">
              <Trash2 size={15} />
            </button>
          </div>
          <Field
            label="Skills (comma separated)"
            value={(cat.items || []).join(', ')}
            onChange={(v) => updateItems(i, v)}
          />
        </div>
      ))}
      <button className="admin-btn-ghost" onClick={addCategory}>
        <Plus size={15} /> Add Category
      </button>
      <SaveButton onClick={() => onSave(list)} />
    </Section>
  );
}

// ==========================================================
// PROJECTS TAB
// ==========================================================
function ProjectsTab({ projects, onSave }) {
  const [list, setList] = useState(projects || []);
  useEffect(() => setList(projects || []), [projects]);

  const blank = () => ({
    id: Date.now(),
    title: 'New Project',
    description: '',
    tech: [],
    image: '',
    liveUrl: '',
    githubUrl: '',
    featured: false
  });

  const add = () => setList((l) => [...l, blank()]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const update = (i, key, value) =>
    setList((l) => l.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  return (
    <Section title="Projects" subtitle="Case studies and project cards shown on your site.">
      {list.map((p, i) => (
        <div className="admin-card" key={p.id || i}>
          <div className="admin-card-row">
            <Field label="Title" value={p.title} onChange={(v) => update(i, 'title', v)} />
            <button className="admin-icon-btn danger" onClick={() => remove(i)} title="Remove project">
              <Trash2 size={15} />
            </button>
          </div>
          <Field label="Description" textarea value={p.description} onChange={(v) => update(i, 'description', v)} />
          <div className="admin-grid-2">
            <Field label="Live URL" value={p.liveUrl} onChange={(v) => update(i, 'liveUrl', v)} />
            <Field label="GitHub URL" value={p.githubUrl} onChange={(v) => update(i, 'githubUrl', v)} />
          </div>
          <div className="admin-grid-2">
            <Field label="Image URL" value={p.image} onChange={(v) => update(i, 'image', v)} />
            <Field
              label="Tech Stack (comma separated)"
              value={(p.tech || []).join(', ')}
              onChange={(v) => update(i, 'tech', v.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </div>
          <label className="admin-checkbox">
            <input
              type="checkbox"
              checked={!!p.featured}
              onChange={(e) => update(i, 'featured', e.target.checked)}
            />
            Featured project
          </label>
        </div>
      ))}
      <button className="admin-btn-ghost" onClick={add}>
        <Plus size={15} /> Add Project
      </button>
      <SaveButton onClick={() => onSave(list)} />
    </Section>
  );
}

// ==========================================================
// EXPERIENCE TAB
// ==========================================================
function ExperienceTab({ experience, onSave }) {
  const [list, setList] = useState(experience || []);
  useEffect(() => setList(experience || []), [experience]);

  const blank = () => ({
    id: Date.now(),
    company: 'Company Name',
    role: 'Role',
    duration: '',
    description: '',
    achievements: []
  });

  const add = () => setList((l) => [...l, blank()]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const update = (i, key, value) =>
    setList((l) => l.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));

  return (
    <Section title="Experience" subtitle="Your work history timeline.">
      {list.map((e, i) => (
        <div className="admin-card" key={e.id || i}>
          <div className="admin-card-row">
            <Field label="Company" value={e.company} onChange={(v) => update(i, 'company', v)} />
            <button className="admin-icon-btn danger" onClick={() => remove(i)} title="Remove">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="admin-grid-2">
            <Field label="Role" value={e.role} onChange={(v) => update(i, 'role', v)} />
            <Field label="Duration" value={e.duration} onChange={(v) => update(i, 'duration', v)} />
          </div>
          <Field label="Description" textarea value={e.description} onChange={(v) => update(i, 'description', v)} />
          <Field
            label="Key Achievements (comma separated)"
            value={(e.achievements || []).join(', ')}
            onChange={(v) => update(i, 'achievements', v.split(',').map(s => s.trim()).filter(Boolean))}
          />
        </div>
      ))}
      <button className="admin-btn-ghost" onClick={add}>
        <Plus size={15} /> Add Experience
      </button>
      <SaveButton onClick={() => onSave(list)} />
    </Section>
  );
}

// ==========================================================
// MESSAGES TAB (read-only contact form inbox)
// ==========================================================
function MessagesTab({ messages, onDelete }) {
  return (
    <Section title="Contact Messages" subtitle="Messages submitted through your site's contact form.">
      {messages.length === 0 && <p className="admin-empty">No messages yet.</p>}
      {messages.map((m) => (
        <div className="admin-card" key={m.id}>
          <div className="admin-card-row">
            <div>
              <strong>{m.name}</strong> <span className="admin-muted">— {m.email}</span>
            </div>
            <button className="admin-icon-btn danger" onClick={() => onDelete(m.id)} title="Delete">
              <X size={15} />
            </button>
          </div>
          <p className="admin-message-text">{m.message}</p>
          {m.date && <span className="admin-muted small">{new Date(m.date).toLocaleString()}</span>}
        </div>
      ))}
    </Section>
  );
}

// ==========================================================
// SHARED UI PIECES
// ==========================================================
function Section({ title, subtitle, children }) {
  return (
    <div className="admin-section">
      <header className="admin-section-head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div className="admin-field">
      <label className="admin-field-label">{label}</label>
      {textarea ? (
        <textarea
          className="admin-input"
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="admin-input"
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SaveButton({ onClick }) {
  return (
    <button className="admin-btn-primary admin-save-btn" onClick={onClick}>
      <Save size={16} /> Save Changes
    </button>
  );
}
