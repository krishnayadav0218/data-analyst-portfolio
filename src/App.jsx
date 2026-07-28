import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import MatrixRain from './MatrixRain.jsx';
import Hero3D from './Hero3D.jsx';
import ProjectCard from './ProjectCard.jsx';
import CountUp from './CountUp.jsx';
import SkillBars from './SkillBars.jsx';
import useTiltEffect from './useTiltEffect';
import useScrollReveal from './useScrollReveal';

// Code-split the heaviest pieces so a first-time visitor isn't downloading
// three.js or the whole admin dashboard before they've even seen the hero.
const TechStackCard3D = lazy(() => import('./TechStackCard3D.jsx'));
const AdminPanel = lazy(() => import('./admin/AdminPanel'));
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
  Search,
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
import ProjectDetail from './ProjectDetail';
import BlogDetail from './BlogDetail';
import { profileData } from './profileData';
import { slugify } from './utils/slugify';

// Fallback data for the interactive hero "Client Growth View" chart, used
// whenever profile.growthChart isn't set from content.json / the admin panel.
const DEFAULT_CHART_PERIODS = [
  {
    label: 'Weekly',
    title: 'Q4 Analytics',
    unit: '%',
    bars: [
      { label: 'Mon', value: 42 },
      { label: 'Tue', value: 68 },
      { label: 'Wed', value: 54 },
      { label: 'Thu', value: 82 },
      { label: 'Fri', value: 73 },
      { label: 'Sat', value: 92 },
    ],
  },
  {
    label: 'Monthly',
    title: '6-Month Trend',
    unit: '%',
    bars: [
      { label: 'Feb', value: 38 },
      { label: 'Mar', value: 51 },
      { label: 'Apr', value: 47 },
      { label: 'May', value: 66 },
      { label: 'Jun', value: 79 },
      { label: 'Jul', value: 88 },
    ],
  },
  {
    label: 'Quarterly',
    title: 'Yearly Growth',
    unit: '%',
    bars: [
      { label: 'Q1', value: 46 },
      { label: 'Q2', value: 61 },
      { label: 'Q3', value: 70 },
      { label: 'Q4', value: 85 },
      { label: 'Q1 \'26', value: 91 },
      { label: 'Q2 \'26', value: 97 },
    ],
  },
];

// Framer Motion variants for the smooth, spring-based scroll reveal used by
// the interactive tech-stack section below (separate from the CSS-driven
// useScrollReveal hook used elsewhere on the page).
const fadeUpVariant = {
  hidden: { opacity: 0, y: 42 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainerVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14 } },
};

function App() {
  const isAdminRoute = window.location.pathname === '/admin';
  const projectRouteMatch = window.location.pathname.match(/^\/projects\/([^/]+)\/?$/);
  const projectSlug = projectRouteMatch ? projectRouteMatch[1] : null;
  const blogRouteMatch = window.location.pathname.match(/^\/blog\/([^/]+)\/?$/);
  const blogSlug = blogRouteMatch ? blogRouteMatch[1] : null;
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

  // Real 3D pointer-tilt on any `.tilt-card` element, plus a scroll-triggered
  // 3D reveal for anything marked `.reveal`.
  useTiltEffect();
  useScrollReveal();

  // Interactive "Client Growth View" chart in the hero card: clicking the
  // status pill cycles through periods (Weekly/Monthly/Quarterly), each bar
  // is scaled from real data, and hovering a bar shows its exact value.
  const [chartPeriodIndex, setChartPeriodIndex] = useState(0);
  const chartPeriods =
    Array.isArray(profile.growthChart) && profile.growthChart.length
      ? profile.growthChart
      : DEFAULT_CHART_PERIODS;
  const activeChartPeriod = chartPeriods[chartPeriodIndex % chartPeriods.length];
  const chartMaxValue = Math.max(...activeChartPeriod.bars.map((bar) => bar.value), 1);
  const cycleChartPeriod = () =>
    setChartPeriodIndex((index) => (index + 1) % chartPeriods.length);

  const skillGroups = useMemo(() => Object.entries(profile.skills ?? {}), [profile.skills]);

  // ---- Project filter/search bar ----
  const [projectQuery, setProjectQuery] = useState('');
  const [activeProjectTag, setActiveProjectTag] = useState('All');
  const projectTags = useMemo(() => {
    const tags = new Set(profile.projects.map((p) => p.tag).filter(Boolean));
    return ['All', ...Array.from(tags)];
  }, [profile.projects]);
  const filteredProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    return profile.projects.filter((project) => {
      const matchesTag = activeProjectTag === 'All' || project.tag === activeProjectTag;
      if (!matchesTag) return false;
      if (!query) return true;
      const haystack = [project.title, project.tag, project.outcome, ...(project.stack || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [profile.projects, projectQuery, activeProjectTag]);
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

  if (projectSlug) {
    const matchedProject = profile.projects.find((project) => slugify(project.title) === projectSlug);
    return <ProjectDetail project={matchedProject} profileName={profile.name} />;
  }

  if (blogSlug) {
    const matchedPost = profile.blogPosts.find((post) => slugify(post.title) === blogSlug);
    return <BlogDetail post={matchedPost} profileName={profile.name} />;
  }

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="admin-loading">Loading admin panel…</div>}>
        <AdminPanel />
      </Suspense>
    );
  }

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
        <div className="topbar-inner">
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
        </div>
      </nav>

      <section className="hero-section hero3d-wrap" id="home">
        <Hero3D />
        <div className="hero-copy">
          <span className="availability-badge">
            <span className="availability-dot"></span> Available for new opportunities
          </span>
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
            <a
              className="secondary-action"
              href={profile.resumeUrl || '/krishna-yadav-resume.pdf'}
              download={profile.resumeFileName || 'krishna-yadav-resume.pdf'}
            >
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

        <div className="dashboard-visual tilt-card" aria-label="Analytics dashboard preview">
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
              <strong>{activeChartPeriod.title}</strong>
            </div>
            <button
              type="button"
              className="visual-status"
              onClick={cycleChartPeriod}
              aria-label={`Chart period: ${activeChartPeriod.label}. Click to switch period.`}
              title={`Showing ${activeChartPeriod.label} view — click to switch`}
            >
              <span></span>
              {activeChartPeriod.label}
              <BarChart3 size={20} />
            </button>
          </div>
          <div className="kpi-grid">
            {profile.metrics.map((metric) => (
              <div className="kpi" key={metric.label}>
                <strong>
                  <CountUp value={metric.value} />
                </strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
          <div className="chart-row" style={{ '--bar-count': activeChartPeriod.bars.length }}>
            {activeChartPeriod.bars.map((bar, index) => (
              <span
                key={`${activeChartPeriod.label}-${bar.label}`}
                style={{
                  '--bar-height': `${Math.max(8, (bar.value / chartMaxValue) * 100)}%`,
                  animationDelay: `${index * 80}ms`,
                }}
                data-value={`${bar.label}: ${bar.value}${activeChartPeriod.unit || ''}`}
                tabIndex={0}
                role="img"
                aria-label={`${bar.label}: ${bar.value}${activeChartPeriod.unit || ''}`}
              ></span>
            ))}
          </div>
          <div className="chart-labels" style={{ '--bar-count': activeChartPeriod.bars.length }}>
            {activeChartPeriod.bars.map((bar) => (
              <span key={bar.label}>{bar.label}</span>
            ))}
          </div>
          <div className="insight-panel">
            <Target size={22} />
            <p>Built for consulting teams: concise KPI logic, clear assumptions, and insight-first storytelling.</p>
          </div>
        </div>
      </section>

      <motion.section
        className="section tech-card-section"
        id="tech-card"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        variants={staggerContainerVariant}
      >
        <motion.div className="section-heading" variants={fadeUpVariant}>
          <p className="eyebrow">
            <BarChart3 size={16} /> Interactive tech stack
          </p>
          <h2>One card, every tool I bring to a dashboard</h2>
          <p className="section-subtext">
            Flip it like a business card — the front is who I am, the back is what I build with:
            Python and SQL for the data, Power BI for the story, React and Node.js for the delivery.
          </p>
        </motion.div>
        <motion.div className="tech-card-stage" variants={fadeUpVariant}>
          <Suspense fallback={<div className="tech-card-loading">Loading the 3D card…</div>}>
            <TechStackCard3D profile={profile} />
          </Suspense>
        </motion.div>
      </motion.section>

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
              <article className="service-card tilt-card reveal" key={service.title}>
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
            <article className="focus-item reveal" key={area}>
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

        <div className="project-filter-bar">
          <div className="project-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search projects by name, tool, or keyword…"
              value={projectQuery}
              onChange={(e) => setProjectQuery(e.target.value)}
              aria-label="Search projects"
            />
          </div>
          <div className="project-tag-filters">
            {projectTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`project-tag-chip${activeProjectTag === tag ? ' active' : ''}`}
                onClick={() => setActiveProjectTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="project-grid">
            {filteredProjects.map((project, index) => (
              <ProjectCard project={project} index={index} key={project.title} />
            ))}
          </div>
        ) : (
          <div className="project-empty-state">
            <p>No projects match "{projectQuery}" {activeProjectTag !== 'All' ? `in ${activeProjectTag}` : ''}. Try a different keyword or tag.</p>
          </div>
        )}
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
            <article className="blog-card tilt-card reveal" key={post.title}>
              <div className="project-meta">
                <span>{post.category}</span>
                <span>{post.readTime}</span>
              </div>
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
              <div className="project-actions">
                <a href={`/blog/${slugify(post.title)}`}>
                  Read full article <ArrowUpRight size={17} />
                </a>
                <a href="#contact">Discuss this topic</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section split matrix-section-wrap" id="skills">
        <MatrixRain height={520} opacity={0.16} speed={1.1} color="#1d6b66" />
        <div>
          <div className="section-heading left">
            <p className="eyebrow">
              <Award size={16} /> Tools and proof
            </p>
            <h2>Analytics stack aligned to enterprise reporting</h2>
          </div>
          <motion.div
            className="skills-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerContainerVariant}
          >
            {skillGroups.map(([group, skills]) => (
              <motion.article className="skill-group tilt-card" key={group} variants={fadeUpVariant}>
                <h3>
                  {(() => {
                    const Icon = skillIcons[group] ?? skillIcons.default;
                    return <Icon size={20} />;
                  })()}
                  {group}
                </h3>
                <div>
                  {skills.map((skill, index) => (
                    <span key={skill} style={{ '--i': index }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </motion.div>
          {profile.topSkills && profile.topSkills.length > 0 && (
            <div className="skill-bars-block">
              <h3 className="skill-bars-heading">Proficiency at a glance</h3>
              <SkillBars skills={profile.topSkills} />
            </div>
          )}
        </div>
        <aside className="credential-panel tilt-card reveal">
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
            <article className="testimonial-card tilt-card reveal" key={testimonial.name}>
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
            A focused control view for keeping portfolio content, featured work, contact systems, and launch readiness
            organized in one place.
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
            {(profile.socialLinks || []).map((link, i) => (
              <a key={i} href={link.url} target="_blank" rel="noreferrer">
                <ExternalLink size={18} /> {link.label}
              </a>
            ))}
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
