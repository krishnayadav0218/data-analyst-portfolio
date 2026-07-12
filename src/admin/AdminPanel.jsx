import { useState, useEffect, useCallback } from 'react';
import {
  Lock, LayoutDashboard, User, Wrench, FolderKanban,
  GraduationCap, Mail, LogOut, Plus, Trash2, Save, CheckCircle2,
  AlertCircle, Loader2, X, Award
} from 'lucide-react';
import './AdminPanel.css';

// Point this at wherever your Express server actually runs.
// - In local dev (npm run dev) that's http://localhost:5000.
// - In production, server/index.js serves the built frontend AND the
//   API from the SAME origin/port, so we just use relative URLs ('')
//   unless you explicitly override with VITE_API_BASE in your .env.
const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://localhost:5000' : '');

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
      setError('Could not reach the server. Is the backend running? (run "npm run server" or "npm run dev")');
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
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'messages', label: 'Contact', icon: Mail },
];

function Dashboard({ token, onLogout }) {
  const [active, setActive] = useState('profile');
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
    setLoadError('');
    try {
      const [dataRes, msgRes] = await Promise.all([
        authedFetch('/api/admin/data'),
        authedFetch('/api/admin/messages')
      ]);
      if (dataRes.status === 401 || msgRes.status === 401) {
        onLogout();
        return;
      }
      if (!dataRes.ok || !msgRes.ok) throw new Error('Server returned an error.');
      setData(await dataRes.json());
      setMessages(await msgRes.json());
    } catch (err) {
      setLoadError('Could not load data from the server. Is the backend running?');
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
        {loading ? (
          <div className="admin-loading"><Loader2 size={22} className="spin" /></div>
        ) : loadError ? (
          <div className="admin-section">
            <div className="admin-error">
              <AlertCircle size={15} />
              <span>{loadError}</span>
            </div>
            <button className="admin-btn-ghost" onClick={loadAll} style={{ marginTop: 12 }}>
              Retry
            </button>
          </div>
        ) : !data ? null : (
          <>
            {active === 'profile' && (
              <ProfileTab profile={data} onSave={(p) => saveSection('profile', p)} />
            )}
            {active === 'skills' && (
              <SkillsTab skills={data.skills} onSave={(s) => saveSection('skills', s)} />
            )}
            {active === 'projects' && (
              <ProjectsTab projects={data.projects} onSave={(p) => saveSection('projects', p)} />
            )}
            {active === 'education' && (
              <EducationTab education={data.education} onSave={(e) => saveSection('education', e)} />
            )}
            {active === 'certifications' && (
              <CertificationsTab certifications={data.certifications} onSave={(c) => saveSection('certifications', c)} />
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
// PROFILE TAB — flat fields at the root of content.json
// ==========================================================
function ProfileTab({ profile, onSave }) {
  const [form, setForm] = useState(profile || {});
  useEffect(() => setForm(profile || {}), [profile]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <Section title="Profile" subtitle="Your name, headline, and contact details shown across the site.">
      <div className="admin-grid-2">
        <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} />
        <Field label="Role / Title" value={form.role} onChange={(v) => set('role', v)} />
      </div>
      <Field label="Headline" value={form.headline} onChange={(v) => set('headline', v)} />
      <Field label="Summary" textarea value={form.summary} onChange={(v) => set('summary', v)} />
      <div className="admin-grid-2">
        <Field label="Email" value={form.email} onChange={(v) => set('email', v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
      </div>
      <Field label="Location" value={form.location} onChange={(v) => set('location', v)} />

      <h3 className="admin-subhead">Social Links</h3>
      <div className="admin-grid-3">
        <Field label="GitHub" value={form.github} onChange={(v) => set('github', v)} />
        <Field label="LinkedIn" value={form.linkedin} onChange={(v) => set('linkedin', v)} />
        <Field label="Instagram" value={form.instagram} onChange={(v) => set('instagram', v)} />
      </div>

      <SaveButton onClick={() => onSave(form)} />
    </Section>
  );
}

// ==========================================================
// SKILLS TAB — content.json stores skills as { Category: [items] }
// ==========================================================
function SkillsTab({ skills, onSave }) {
  const toEntries = (obj) => Object.entries(obj || {}).map(([category, items]) => ({ category, items }));

  const [list, setList] = useState(toEntries(skills));
  useEffect(() => setList(toEntries(skills)), [skills]);

  const addCategory = () => setList((l) => [...l, { category: 'New Category', items: [] }]);
  const removeCategory = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const updateCategory = (i, value) =>
    setList((l) => l.map((c, idx) => (idx === i ? { ...c, category: value } : c)));
  const updateItems = (i, value) =>
    setList((l) => l.map((c, idx) => (idx === i ? { ...c, items: value.split(',').map(s => s.trim()).filter(Boolean) } : c)));

  const handleSave = () => {
    // Convert back to the { Category: [items] } object shape content.json expects.
    const obj = {};
    for (const { category, items } of list) {
      if (category) obj[category] = items;
    }
    onSave(obj);
  };

  return (
    <Section title="Skills" subtitle="Group your skills into categories (e.g. Languages, Analytics, Libraries).">
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
      <SaveButton onClick={handleSave} />
    </Section>
  );
}

// ==========================================================
// PROJECTS TAB — matches the real project shape used by App.jsx
// (title, tag, year, stack, problem, role, approach, outcome, impact, liveUrl, liveLabel, codeUrl)
// ==========================================================
function ProjectsTab({ projects, onSave }) {
  const [list, setList] = useState(projects || []);
  useEffect(() => setList(projects || []), [projects]);

  const blank = () => ({
    title: 'New Project',
    tag: '',
    year: '',
    stack: [],
    problem: '',
    role: '',
    approach: '',
    outcome: '',
    impact: '',
    liveUrl: '',
    liveLabel: '',
    codeUrl: ''
  });

  const add = () => setList((l) => [...l, blank()]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const update = (i, key, value) =>
    setList((l) => l.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  return (
    <Section title="Projects" subtitle="Case studies and project cards shown on your site.">
      {list.map((p, i) => (
        <div className="admin-card" key={i}>
          <div className="admin-card-row">
            <Field label="Title" value={p.title} onChange={(v) => update(i, 'title', v)} />
            <button className="admin-icon-btn danger" onClick={() => remove(i)} title="Remove project">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="admin-grid-2">
            <Field label="Tag" value={p.tag} onChange={(v) => update(i, 'tag', v)} />
            <Field label="Year / Tool" value={p.year} onChange={(v) => update(i, 'year', v)} />
          </div>
          <Field label="Problem" textarea value={p.problem} onChange={(v) => update(i, 'problem', v)} />
          <Field label="Role" value={p.role} onChange={(v) => update(i, 'role', v)} />
          <Field label="Approach" textarea value={p.approach} onChange={(v) => update(i, 'approach', v)} />
          <Field label="Outcome" textarea value={p.outcome} onChange={(v) => update(i, 'outcome', v)} />
          <Field label="Impact (optional)" textarea value={p.impact} onChange={(v) => update(i, 'impact', v)} />
          <Field
            label="Tech Stack (comma separated)"
            value={(p.stack || []).join(', ')}
            onChange={(v) => update(i, 'stack', v.split(',').map(s => s.trim()).filter(Boolean))}
          />
          <div className="admin-grid-2">
            <Field label="Live URL" value={p.liveUrl} onChange={(v) => update(i, 'liveUrl', v)} />
            <Field label="Live Button Label" value={p.liveLabel} onChange={(v) => update(i, 'liveLabel', v)} />
          </div>
          <Field label="Code URL" value={p.codeUrl} onChange={(v) => update(i, 'codeUrl', v)} />
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
// EDUCATION TAB — { degree, school, years }
// ==========================================================
function EducationTab({ education, onSave }) {
  const [list, setList] = useState(education || []);
  useEffect(() => setList(education || []), [education]);

  const blank = () => ({ degree: '', school: '', years: '' });

  const add = () => setList((l) => [...l, blank()]);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const update = (i, key, value) =>
    setList((l) => l.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));

  return (
    <Section title="Education" subtitle="Your academic background shown on the site.">
      {list.map((e, i) => (
        <div className="admin-card" key={i}>
          <div className="admin-card-row">
            <Field label="Degree" value={e.degree} onChange={(v) => update(i, 'degree', v)} />
            <button className="admin-icon-btn danger" onClick={() => remove(i)} title="Remove">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="admin-grid-2">
            <Field label="School" value={e.school} onChange={(v) => update(i, 'school', v)} />
            <Field label="Years" value={e.years} onChange={(v) => update(i, 'years', v)} />
          </div>
        </div>
      ))}
      <button className="admin-btn-ghost" onClick={add}>
        <Plus size={15} /> Add Education
      </button>
      <SaveButton onClick={() => onSave(list)} />
    </Section>
  );
}

// ==========================================================
// CERTIFICATIONS TAB — array of plain strings
// ==========================================================
function CertificationsTab({ certifications, onSave }) {
  const [list, setList] = useState(certifications || []);
  useEffect(() => setList(certifications || []), [certifications]);

  const add = () => setList((l) => [...l, '']);
  const remove = (i) => setList((l) => l.filter((_, idx) => idx !== i));
  const update = (i, value) => setList((l) => l.map((c, idx) => (idx === i ? value : c)));

  const handleSave = () => onSave(list.map((c) => c.trim()).filter(Boolean));

  return (
    <Section title="Certifications" subtitle="Courses and certificates shown on your site.">
      {list.map((c, i) => (
        <div className="admin-card-row" key={i} style={{ marginBottom: 12 }}>
          <Field label={`Certification ${i + 1}`} value={c} onChange={(v) => update(i, v)} />
          <button className="admin-icon-btn danger" onClick={() => remove(i)} title="Remove certification">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button className="admin-btn-ghost" onClick={add}>
        <Plus size={15} /> Add Certification
      </button>
      <SaveButton onClick={handleSave} />
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
          {(m.date || m.receivedAt) && (
            <span className="admin-muted small">
              {new Date(m.date || m.receivedAt).toLocaleString()}
            </span>
          )}
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
