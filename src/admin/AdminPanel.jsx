import { useEffect, useMemo, useState } from 'react';
import './AdminPanel.css';

const GH_OWNER = 'krishnayadav0218';
const GH_REPO = 'data-analyst-portfolio';
const GH_BRANCH = 'main';
const CONTENT_PATH = 'src/data/content.json';
const RAW_URL = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${CONTENT_PATH}`;

const textAreas = new Set(['summary', 'headline', 'problem', 'role', 'approach', 'outcome', 'impact', 'detail', 'answer', 'quote']);

async function callFunction(name, body) {
  const paths = [`/.netlify/functions/${name}`, `/api/${name}`];
  let lastError;

  for (const path of paths) {
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 404) {
        lastError = new Error('Endpoint not found');
        continue;
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('No admin endpoint found');
}

function emptyForSection(section) {
  const templates = {
    metrics: { value: '', label: '' },
    focusAreas: '',
    education: { degree: '', school: '', years: '' },
    projects: {
      title: '',
      tag: '',
      year: '',
      problem: '',
      role: '',
      approach: '',
      outcome: '',
      impact: '',
      stack: [],
      liveUrl: '',
      liveLabel: 'Live Demo',
      codeUrl: '',
    },
    certifications: '',
    blogPosts: { title: '', category: '', readTime: '', summary: '' },
    testimonials: { name: '', role: '', quote: '' },
    adminStats: { label: '', value: '' },
    services: { title: '', detail: '' },
    faqs: { question: '', answer: '' },
    crmPipeline: { stage: '', count: '' },
  };

  return templates[section] ?? {};
}

function LoginScreen({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await callFunction('admin-login', { password });
      if (result.success) {
        sessionStorage.setItem('admin_pw', password);
        onSuccess(password);
      } else {
        setError('Wrong password.');
      }
    } catch (error) {
      setError(`Could not reach admin server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-wrap">
      <form className="admin-login-box" onSubmit={submit}>
        <p className="admin-kicker">Krishna portfolio</p>
        <h1>Admin Login</h1>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Checking...' : 'Login'}
        </button>
        {error && <p className="admin-error">{error}</p>}
      </form>
    </main>
  );
}

function Field({ label, value, onChange }) {
  const stringValue = Array.isArray(value) ? value.join(', ') : value ?? '';
  const update = (nextValue) => {
    if (Array.isArray(value)) {
      onChange(nextValue.split(',').map((item) => item.trim()).filter(Boolean));
      return;
    }
    onChange(nextValue);
  };

  return (
    <label className="admin-field">
      <span>{label}</span>
      {textAreas.has(label) || String(stringValue).length > 78 ? (
        <textarea value={stringValue} onChange={(event) => update(event.target.value)} rows={3} />
      ) : (
        <input value={stringValue} onChange={(event) => update(event.target.value)} />
      )}
    </label>
  );
}

function ObjectEditor({ title, data, onChange, fields }) {
  const keys = fields ?? Object.keys(data ?? {});
  const update = (key, value) => onChange({ ...data, [key]: value });

  return (
    <section className="admin-section">
      <h2>{title}</h2>
      <div className="admin-grid">
        {keys.map((key) => (
          <Field key={key} label={key} value={data?.[key]} onChange={(value) => update(key, value)} />
        ))}
      </div>
    </section>
  );
}

function ArrayEditor({ title, items, onChange, section }) {
  const updateItem = (index, key, value) => {
    const next = [...items];
    next[index] = typeof next[index] === 'string' ? value : { ...next[index], [key]: value };
    onChange(next);
  };
  const removeItem = (index) => onChange(items.filter((_, itemIndex) => itemIndex !== index));
  const addItem = () => onChange([...items, emptyForSection(section)]);

  return (
    <section className="admin-section">
      <div className="admin-section-title">
        <h2>{title}</h2>
        <button type="button" className="admin-add-small" onClick={addItem}>
          Add
        </button>
      </div>
      {(items ?? []).map((item, index) => (
        <article className="admin-card" key={`${title}-${index}`}>
          {typeof item === 'string' ? (
            <Field label="value" value={item} onChange={(value) => updateItem(index, 'value', value)} />
          ) : (
            Object.keys(item).map((key) => (
              <Field key={key} label={key} value={item[key]} onChange={(value) => updateItem(index, key, value)} />
            ))
          )}
          <button type="button" className="admin-remove" onClick={() => removeItem(index)}>
            Remove
          </button>
        </article>
      ))}
    </section>
  );
}

function SkillsEditor({ skills, onChange }) {
  const groups = useMemo(() => Object.entries(skills ?? {}), [skills]);
  const updateGroup = (group, value) => onChange({ ...skills, [group]: value });

  return (
    <section className="admin-section">
      <h2>Skills</h2>
      <div className="admin-grid">
        {groups.map(([group, values]) => (
          <Field key={group} label={group} value={values} onChange={(value) => updateGroup(group, value)} />
        ))}
      </div>
    </section>
  );
}

export default function AdminPanel() {
  const initialPassword = sessionStorage.getItem('admin_pw') || '';
  const [authed, setAuthed] = useState(Boolean(initialPassword));
  const [password, setPassword] = useState(initialPassword);
  const [content, setContent] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authed) return;
    fetch(`${RAW_URL}?t=${Date.now()}`)
      .then((response) => response.json())
      .then(setContent)
      .catch(() => setStatus('Could not load current portfolio content from GitHub.'));
  }, [authed]);

  const update = (key, value) => setContent({ ...content, [key]: value });

  const save = async () => {
    setSaving(true);
    setStatus('');

    try {
      const result = await callFunction('admin-save', { password, content });
      if (result.success) {
        setStatus('Saved. Netlify will rebuild the portfolio automatically in 1-2 minutes.');
      } else {
        setStatus(result.error || 'Save failed.');
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <LoginScreen
        onSuccess={(nextPassword) => {
          setPassword(nextPassword);
          setAuthed(true);
        }}
      />
    );
  }

  if (!content) {
    return <main className="admin-loading">Loading current content...</main>;
  }

  return (
    <main className="admin-wrap">
      <header className="admin-header">
        <div>
          <p className="admin-kicker">Portfolio CMS</p>
          <h1>Admin Panel</h1>
        </div>
        <div className="admin-actions">
          <a href="/" className="admin-link">
            View site
          </a>
          <button onClick={save} disabled={saving} className="admin-save-btn">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </header>

      {status && <p className="admin-status">{status}</p>}

      <ObjectEditor
        title="Profile"
        data={content}
        fields={['name', 'role', 'location', 'email', 'phone', 'linkedin', 'github', 'instagram', 'summary', 'headline']}
        onChange={(value) => setContent({ ...content, ...value })}
      />
      <ArrayEditor title="Hero Metrics" items={content.metrics} section="metrics" onChange={(value) => update('metrics', value)} />
      <ArrayEditor title="Focus Areas" items={content.focusAreas} section="focusAreas" onChange={(value) => update('focusAreas', value)} />
      <ArrayEditor title="Education" items={content.education} section="education" onChange={(value) => update('education', value)} />
      <ArrayEditor title="Projects" items={content.projects} section="projects" onChange={(value) => update('projects', value)} />
      <SkillsEditor skills={content.skills} onChange={(value) => update('skills', value)} />
      <ArrayEditor title="Certifications" items={content.certifications} section="certifications" onChange={(value) => update('certifications', value)} />
      <ArrayEditor title="Blog Posts" items={content.blogPosts} section="blogPosts" onChange={(value) => update('blogPosts', value)} />
      <ArrayEditor title="Testimonials" items={content.testimonials} section="testimonials" onChange={(value) => update('testimonials', value)} />
      <ArrayEditor title="Services" items={content.services} section="services" onChange={(value) => update('services', value)} />
      <ArrayEditor title="FAQs" items={content.faqs} section="faqs" onChange={(value) => update('faqs', value)} />
      <ArrayEditor title="CRM Pipeline" items={content.crmPipeline} section="crmPipeline" onChange={(value) => update('crmPipeline', value)} />

      <button onClick={save} disabled={saving} className="admin-save-btn admin-save-bottom">
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </main>
  );
}
