import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BarChart3,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Database,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Send,
  Target,
} from 'lucide-react';
import './App.css';
import { profileData } from './profileData';

function App() {
  const [profile, setProfile] = useState(profileData);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then(setProfile)
      .catch(() => setProfile(profileData));
  }, []);

  const skillGroups = useMemo(() => Object.entries(profile.skills ?? {}), [profile.skills]);

  const submitMessage = async (event) => {
    event.preventDefault();
    setStatus('Sending...');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) throw new Error('Could not send message.');
      setForm({ name: '', email: '', message: '' });
      setStatus('Message sent directly to Krishna by email.');
    } catch {
      setStatus('Message could not be saved right now. Please use email or LinkedIn.');
    }
  };

  return (
    <main>
      <nav className="topbar" aria-label="Portfolio navigation">
        <a className="brand" href="#home" aria-label="Krishna Yadav portfolio home">
          <span>KY</span>
          <strong>Krishna Yadav</strong>
        </a>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <h1>{profile.headline}</h1>
          <p className="intro">{profile.summary}</p>
          <div className="hero-actions">
            <a className="primary-action" href={`mailto:${profile.email}`}>
              <Mail size={18} /> Hire for analytics work
            </a>
            <a className="secondary-action" href="#projects">
              View case studies <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="contact-strip" aria-label="Contact information">
            <span>
              <MapPin size={16} /> {profile.location}
            </span>
            <span>
              <Phone size={16} /> {profile.phone}
            </span>
            <span>
              <Mail size={16} /> {profile.email}
            </span>
          </div>
        </div>

        <div className="dashboard-visual" aria-label="Analytics dashboard preview">
          <div className="visual-header">
            <div>
              <span>Client Growth View</span>
              <strong>Q4 Analytics</strong>
            </div>
            <div className="visual-status" aria-hidden="true">
              <span></span>
              <BarChart3 size={26} />
            </div>
          </div>
          <div className="kpi-grid">
            {profile.metrics.map((metric) => (
              <div className="kpi" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-row">
            <span style={{ '--bar-height': '42%' }}></span>
            <span style={{ '--bar-height': '68%' }}></span>
            <span style={{ '--bar-height': '54%' }}></span>
            <span style={{ '--bar-height': '82%' }}></span>
            <span style={{ '--bar-height': '73%' }}></span>
            <span style={{ '--bar-height': '92%' }}></span>
          </div>
          <div className="insight-panel">
            <Target size={22} />
            <p>Built for consulting teams: concise KPI logic, clear assumptions, and insight-first storytelling.</p>
          </div>
        </div>
      </section>

      <section className="section band">
        <div className="section-heading">
          <p className="eyebrow">
            <BriefcaseBusiness size={16} /> Analyst value
          </p>
          <h2>What Krishna brings to business teams</h2>
        </div>
        <div className="focus-grid">
          {profile.focusAreas.map((area) => (
            <article className="focus-item" key={area}>
              <CheckCircle2 size={20} />
              <span>{area}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="projects">
        <div className="section-heading">
          <p className="eyebrow">
            <Database size={16} /> Selected work
          </p>
          <h2>Projects framed as business case studies</h2>
        </div>
        <div className="project-grid">
          {profile.projects.map((project) => (
            <article className="project-card" key={project.title}>
              <div className="project-meta">
                <span>{project.tag}</span>
                <span>{project.year}</span>
              </div>
              <h3>{project.title}</h3>
              <p>
                <strong>Problem:</strong> {project.problem}
              </p>
              <p>
                <strong>Approach:</strong> {project.approach}
              </p>
              <p>
                <strong>Outcome:</strong> {project.outcome}
              </p>
              <div className="stack-list">
                {project.stack.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section split" id="skills">
        <div>
          <div className="section-heading left">
            <p className="eyebrow">
              <Award size={16} /> Tools and proof
            </p>
            <h2>Analytics stack aligned to enterprise reporting</h2>
          </div>
          <div className="skills-grid">
            {skillGroups.map(([group, skills]) => (
              <article className="skill-group" key={group}>
                <h3>{group}</h3>
                <div>
                  {skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="credential-panel">
          <h3>
            <GraduationCap size={20} /> Education
          </h3>
          {profile.education.map((item) => (
            <div className="timeline-item" key={item.degree}>
              <strong>{item.degree}</strong>
              <span>{item.school}</span>
              <small>{item.years}</small>
            </div>
          ))}
          <h3>
            <Award size={20} /> Certifications
          </h3>
          <ul>
            {profile.certifications.map((certification) => (
              <li key={certification}>{certification}</li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="section contact-section" id="contact">
        <div className="contact-copy">
          <p className="eyebrow">
            <Send size={16} /> Contact
          </p>
          <h2>Ready for data analyst, BI analyst, and junior data scientist roles.</h2>
          <p>
            Best fit: analytics teams that need dashboard thinking, clean SQL/Python foundations, and a business-first
            presentation style.
          </p>
          <div className="social-actions">
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              <ExternalLink size={18} /> LinkedIn
            </a>
            <a href={profile.github} target="_blank" rel="noreferrer">
              <GitBranch size={18} /> GitHub
            </a>
            <a href={profile.instagram} target="_blank" rel="noreferrer">
              <Camera size={18} /> Instagram
            </a>
          </div>
        </div>
        <form className="contact-form" onSubmit={submitMessage}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Your name"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@company.com"
              required
            />
          </label>
          <label>
            Message
            <textarea
              value={form.message}
              onChange={(event) => setForm({ ...form, message: event.target.value })}
              placeholder="Tell Krishna about the role or project"
              required
            />
          </label>
          <button type="submit">
            <Send size={18} /> Send message
          </button>
          <p className="form-status" aria-live="polite">
            {status}
          </p>
        </form>
      </section>
    </main>
  );
}

export default App;
