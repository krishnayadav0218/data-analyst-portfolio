import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Award,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Camera,
  CalendarCheck,
  CheckCircle2,
  Code2,
  Download,
  Database,
  ExternalLink,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MessageCircle,
  MapPin,
  Moon,
  Phone,
  Server,
  Send,
  Sun,
  Target,
  Users,
  Wrench,
} from 'lucide-react';
import './App.css';
import { profileData } from './profileData';

function App() {
  const [profile, setProfile] = useState(profileData);
  const [theme, setTheme] = useState('light');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [leadStatus, setLeadStatus] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [leadForm, setLeadForm] = useState({ name: '', email: '', service: 'Dashboard Development', message: '' });
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', date: '', message: '' });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      from: 'assistant',
      text: 'Hi, I can help with FAQs, service details, lead capture, WhatsApp, and appointment booking.',
    },
  ]);

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.json())
      .then((data) => setProfile({ ...profileData, ...data }))
      .catch(() => setProfile(profileData));
  }, []);

  const skillGroups = useMemo(() => Object.entries(profile.skills ?? {}), [profile.skills]);
  const skillIcons = {
    Languages: Code2,
    Analytics: BarChart3,
    Libraries: Database,
    Databases: Server,
    Web: Code2,
    AI: Bot,
    default: Wrench,
  };
  const toggleTheme = () => setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  const whatsappUrl = `https://wa.me/91${profile.phone}?text=${encodeURIComponent(
    'Hi Krishna, I visited your portfolio and want to discuss an analytics project.',
  )}`;

  const sendPortfolioMessage = async (payload) => {
    const apiResponse = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (apiResponse?.ok) return true;

    const emailResponse = await fetch('https://formspree.io/f/mbdvyjze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
        source: payload.source ?? 'Portfolio form',
        service: payload.service ?? 'General inquiry',
        message: payload.message,
      }),
    }).catch(() => null);

    return Boolean(emailResponse?.ok);
  };

  const askChatbot = (topic) => {
    const answers = {
      faqs: 'FAQs: Krishna helps with dashboards, SQL/Python analysis, KPI reporting, data cleaning, and ML prototypes.',
      services:
        'Services: dashboard development, data analysis support, business reporting, and machine learning prototypes.',
      lead: 'Lead capture: use the lead form below or send a WhatsApp message for faster follow-up.',
      booking: 'Appointment booking: fill the booking request form and Krishna will confirm by email or WhatsApp.',
      crm: 'CRM integration: portfolio leads are structured for CRM follow-up with source, service, contact, and message fields.',
    };

    setChatOpen(true);
    setChatMessages((messages) => [
      ...messages,
      { from: 'user', text: topic },
      { from: 'assistant', text: answers[topic] ?? answers.services },
    ]);
  };

  const submitMessage = async (event) => {
    event.preventDefault();
    setStatus('Sending...');
    setStatusType('pending');

    try {
      const sent = await sendPortfolioMessage({ ...form, source: 'Contact form' });

      if (!sent) throw new Error('Could not send message.');
      setForm({ name: '', email: '', message: '' });
      setStatus('Thank you. Your message has been sent successfully.');
      setStatusType('success');
    } catch {
      setStatus('Message could not be sent. Please try again or use WhatsApp.');
      setStatusType('error');
    }
  };

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadStatus('Sending lead...');

    try {
      const sent = await sendPortfolioMessage({
        ...leadForm,
        message: `Service: ${leadForm.service}. ${leadForm.message}`,
        source: 'Lead generation form',
      });

      if (!sent) throw new Error('Could not send lead.');
      setLeadForm({ name: '', email: '', service: 'Dashboard Development', message: '' });
      setLeadStatus('Thank you. Your lead has been sent successfully.');
    } catch {
      setLeadStatus('Lead could not be sent right now. Please use WhatsApp.');
    }
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    setBookingStatus('Sending booking request...');

    try {
      const sent = await sendPortfolioMessage({
        name: bookingForm.name,
        email: bookingForm.email,
        message: `Appointment request for ${bookingForm.date}. ${bookingForm.message}`,
        source: 'Appointment booking form',
        service: 'Appointment booking',
      });

      if (!sent) throw new Error('Could not send booking.');
      setBookingForm({ name: '', email: '', date: '', message: '' });
      setBookingStatus('Thank you. Your appointment request has been sent.');
    } catch {
      setBookingStatus('Booking request could not be sent. Please use WhatsApp.');
    }
  };

  return (
    <main data-theme={theme}>
      <nav className="topbar" aria-label="Portfolio navigation">
        <a className="brand" href="#home" aria-label="Krishna Yadav portfolio home">
          <span>KY</span>
          <strong>Krishna Yadav</strong>
        </a>
        <div className="nav-links">
          <a href="#projects">Projects</a>
          <a href="#blog">Blog</a>
          <a href="#services">Services</a>
          <a href="#leads">Leads</a>
          <a href="#skills">Skills</a>
          <a href="#admin">Admin</a>
          <a href="#contact">Contact</a>
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle dark and light theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </nav>

      <section className="hero-section" id="home">
        <div className="hero-copy">
          <p className="role-pill">{profile.role}</p>
          <h1>{profile.headline}</h1>
          <p className="intro">{profile.summary}</p>
          <div className="hero-actions">
            <a className="primary-action" href={`mailto:${profile.email}`}>
              <Mail size={18} /> Hire for analytics work
            </a>
            <a className="secondary-action" href="#projects">
              View case studies <ArrowUpRight size={18} />
            </a>
            <a className="secondary-action" href="/krishna-yadav-resume.pdf" download>
              <Download size={18} /> Download resume
            </a>
            <a className="secondary-action" href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> WhatsApp
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
          <div className="avatar-panel" aria-label="Krishna profile avatar">
            <div className="avatar-orbit">
              <img src="/krishna-yadav-profile.jpeg" alt="Krishna Yadav professional portrait" />
            </div>
            <div>
              <strong>Krishna Yadav</strong>
              <p>Data analyst building dashboards, web apps, and automation-ready tools.</p>
            </div>
          </div>
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

      <section className="section services-section" id="services">
        <div className="section-heading">
          <p className="eyebrow">
            <Users size={16} /> Professional services
          </p>
          <h2>Service details, FAQs, and chatbot-ready answers</h2>
        </div>
        <div className="services-layout">
          <div className="service-grid">
            {profile.services.map((service) => (
              <article className="service-card" key={service.title}>
                <CheckCircle2 size={22} />
                <h3>{service.title}</h3>
                <p>{service.detail}</p>
              </article>
            ))}
          </div>
          <div className="faq-panel">
            <h3>FAQs</h3>
            {profile.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
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
                <strong>My Role:</strong> {project.role}
              </p>
              <p>
                <strong>Approach:</strong> {project.approach}
              </p>
              <p>
                <strong>Outcome:</strong> {project.outcome}
              </p>
              {project.impact && (
                <p className="project-impact">
                  <strong>Impact:</strong> {project.impact}
                </p>
              )}
              <div className="stack-list">
                {project.stack.map((tool) => (
                  <span key={tool}>{tool}</span>
                ))}
              </div>
              <div className="project-actions">
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={17} /> {project.liveLabel || 'Live Demo'}
                  </a>
                )}
                {project.codeUrl && (
                  <a href={project.codeUrl} target="_blank" rel="noreferrer">
                    <GitBranch size={17} /> GitHub
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="blog">
        <div className="section-heading">
          <p className="eyebrow">
            <Database size={16} /> Blog
          </p>
          <h2>Short analytics notes and learning stories</h2>
        </div>
        <div className="blog-grid">
          {profile.blogPosts.map((post) => (
            <article className="blog-card" key={post.title}>
              <div className="project-meta">
                <span>{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
              <a href="#contact">
                Discuss this topic <ArrowUpRight size={17} />
              </a>
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
                <h3>
                  {(() => {
                    const Icon = skillIcons[group] ?? skillIcons.default;
                    return <Icon size={20} />;
                  })()}
                  {group}
                </h3>
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

      <section className="section testimonials-section">
        <div className="section-heading">
          <p className="eyebrow">
            <Award size={16} /> Testimonials
          </p>
          <h2>What people can expect while working with Krishna</h2>
        </div>
        <div className="testimonial-grid">
          {profile.testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <p>"{testimonial.quote}"</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.role}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section admin-section" id="admin">
        <div className="admin-copy">
          <p className="eyebrow">
            <LayoutDashboard size={16} /> Admin panel
          </p>
          <h2>Portfolio content control center</h2>
          <p>
            A clean admin-style overview for tracking sections, projects, skills, contact readiness, and publishing
            status.
          </p>
        </div>
        <div className="admin-panel">
          {profile.adminStats.map((stat) => (
            <article className="admin-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
          <div className="admin-activity crm-activity">
            <h3>CRM pipeline</h3>
            <div className="crm-grid">
              {profile.crmPipeline.map((item) => (
                <span key={item.stage}>
                  <strong>{item.count}</strong>
                  {item.stage}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section lead-booking-section" id="leads">
        <div className="section-heading">
          <p className="eyebrow">
            <CalendarCheck size={16} /> Lead generation
          </p>
          <h2>Lead capture, appointment booking, WhatsApp CTA, and email notifications</h2>
        </div>
        <div className="lead-booking-grid">
          <form className="contact-form" onSubmit={submitLead}>
            <h3>Lead capture form</h3>
            <label>
              Name
              <input
                value={leadForm.name}
                onChange={(event) => setLeadForm({ ...leadForm, name: event.target.value })}
                placeholder="Your name"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={leadForm.email}
                onChange={(event) => setLeadForm({ ...leadForm, email: event.target.value })}
                placeholder="you@company.com"
                required
              />
            </label>
            <label>
              Service
              <select
                value={leadForm.service}
                onChange={(event) => setLeadForm({ ...leadForm, service: event.target.value })}
              >
                {profile.services.map((service) => (
                  <option key={service.title}>{service.title}</option>
                ))}
              </select>
            </label>
            <label>
              Requirement
              <textarea
                value={leadForm.message}
                onChange={(event) => setLeadForm({ ...leadForm, message: event.target.value })}
                placeholder="Tell Krishna what you need"
                required
              />
            </label>
            <button type="submit">
              <Send size={18} /> Capture lead
            </button>
            <p className="form-status" aria-live="polite">
              {leadStatus}
            </p>
          </form>

          <form className="contact-form" onSubmit={submitBooking}>
            <h3>Appointment booking</h3>
            <label>
              Name
              <input
                value={bookingForm.name}
                onChange={(event) => setBookingForm({ ...bookingForm, name: event.target.value })}
                placeholder="Your name"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={bookingForm.email}
                onChange={(event) => setBookingForm({ ...bookingForm, email: event.target.value })}
                placeholder="you@company.com"
                required
              />
            </label>
            <label>
              Preferred date
              <input
                type="date"
                value={bookingForm.date}
                onChange={(event) => setBookingForm({ ...bookingForm, date: event.target.value })}
                required
              />
            </label>
            <label>
              Notes
              <textarea
                value={bookingForm.message}
                onChange={(event) => setBookingForm({ ...bookingForm, message: event.target.value })}
                placeholder="Preferred time, project details, or role details"
                required
              />
            </label>
            <button type="submit">
              <CalendarCheck size={18} /> Request appointment
            </button>
            <a className="whatsapp-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Continue on WhatsApp
            </a>
            <p className="form-status" aria-live="polite">
              {bookingStatus}
            </p>
          </form>
        </div>
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
          <p className={`form-status ${statusType}`} aria-live="polite">
            {status}
          </p>
        </form>
      </section>

      <aside className={`chatbot ${chatOpen ? 'open' : ''}`} aria-label="AI chat assistant">
        {chatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <div>
                <strong>AI Chat Assistant</strong>
                <span>FAQs, services, leads, booking</span>
              </div>
              <button type="button" onClick={() => setChatOpen(false)} aria-label="Close chat">
                x
              </button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <p className={message.from} key={`${message.from}-${index}`}>
                  {message.text}
                </p>
              ))}
            </div>
            <div className="chat-quick-actions">
              <button type="button" onClick={() => askChatbot('faqs')}>
                FAQs
              </button>
              <button type="button" onClick={() => askChatbot('services')}>
                Services
              </button>
              <button type="button" onClick={() => askChatbot('lead')}>
                Lead capture
              </button>
              <button type="button" onClick={() => askChatbot('booking')}>
                Booking
              </button>
              <button type="button" onClick={() => askChatbot('crm')}>
                CRM
              </button>
            </div>
          </div>
        )}
        <button className="chat-toggle" type="button" onClick={() => setChatOpen((open) => !open)}>
          <Bot size={22} /> AI Assistant
        </button>
      </aside>
    </main>
  );
}

export default App;
