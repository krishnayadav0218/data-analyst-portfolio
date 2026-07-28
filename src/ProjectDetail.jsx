import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Database, ExternalLink, GitBranch } from 'lucide-react';

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function ProjectDetail({ project, profileName = 'Krishna Yadav' }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!project) {
      document.title = `Project not found | ${profileName} - Data Analyst Portfolio`;
      return;
    }
    document.title = `${project.title} | ${profileName} - Data Analyst & Power BI Developer`;
    const description = `${project.title}: ${project.problem} ${project.outcome}`.slice(0, 156).trim();
    setMetaDescription(description);
  }, [project, profileName]);

  if (!project) {
    return (
      <main className="project-detail-page">
        <nav className="topbar" aria-label="Project navigation">
          <div className="topbar-inner">
            <a className="brand" href="/" aria-label={`Back to ${profileName} portfolio home`}>
              <span>KY</span>
              <strong>{profileName}</strong>
            </a>
          </div>
        </nav>
        <section className="section">
          <h1>Project not found</h1>
          <p className="intro">This project link has moved or no longer exists.</p>
          <a className="primary-action" href="/">
            <ArrowLeft size={18} /> Back to portfolio
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="project-detail-page">
      <nav className="topbar" aria-label="Project navigation">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label={`Back to ${profileName} portfolio home`}>
            <span>KY</span>
            <strong>{profileName}</strong>
          </a>
          <a className="secondary-action" href="/#projects">
            <ArrowLeft size={17} /> All projects
          </a>
        </div>
      </nav>

      {project.coverImage && (
        <div className="project-detail-cover">
          <img src={project.coverImage} alt={`${project.title} cover`} loading="lazy" />
          <span className="project-cover-scrim" aria-hidden="true"></span>
          <span className="project-cover-tag">Case Study</span>
          <span className="project-cover-year">{project.year}</span>
        </div>
      )}

      <section className="section project-detail-hero">
        <p className="eyebrow">
          <Database size={16} /> {project.tag} &middot; {project.year}
        </p>
        <h1>{project.title}</h1>
        <p className="intro">{project.problem}</p>
        <div className="project-actions">
          {project.liveUrl && (
            <a className="primary-action" href={project.liveUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} /> {project.liveLabel || 'Live Demo'}
            </a>
          )}
          {project.codeUrl && (
            <a className="secondary-action" href={project.codeUrl} target="_blank" rel="noreferrer">
              <GitBranch size={17} /> View Code on GitHub
            </a>
          )}
        </div>
      </section>

      <section className="section project-detail-body">
        <motion.article
          className="project-detail-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2>Problem</h2>
          <p>{project.problem}</p>
        </motion.article>

        <motion.article
          className="project-detail-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <h2>My Role</h2>
          <p>{project.role}</p>
        </motion.article>

        <motion.article
          className="project-detail-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Approach</h2>
          <p>{project.approach}</p>
        </motion.article>

        <motion.article
          className="project-detail-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2>Result</h2>
          <p>{project.outcome}</p>
          {project.impact && <p className="project-impact">{project.impact}</p>}
        </motion.article>

        <motion.article
          className="project-detail-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>Tools Used</h2>
          <div className="stack-list">
            {project.stack.map((tool, index) => (
              <span key={tool} style={{ '--i': index }}>
                {tool}
              </span>
            ))}
          </div>
        </motion.article>
      </section>
    </main>
  );
}

export default ProjectDetail;
