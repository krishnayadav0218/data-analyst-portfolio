import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Bot,
  Workflow,
  Database,
  LayoutDashboard,
  ChevronDown,
  ExternalLink,
  GitBranch,
  ArrowUpRight,
} from 'lucide-react';
import { slugify } from './utils/slugify';

const cardFadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

// Pick a cover icon that roughly matches the project's domain, the same way
// the reference sites use a distinct cover image per case study.
function pickCoverIcon(project) {
  const text = `${project.tag || ''} ${project.title || ''}`.toLowerCase();
  if (text.includes('ai') || text.includes('chat')) return Bot;
  if (text.includes('attendance') || text.includes('hrms') || text.includes('workflow')) return Workflow;
  if (text.includes('dashboard') || text.includes('analytics') || text.includes('bi')) return BarChart3;
  if (text.includes('sql') || text.includes('data')) return Database;
  return LayoutDashboard;
}

const COVER_THEMES = ['cover-teal', 'cover-gold', 'cover-rust'];

export default function ProjectCard({ project, index }) {
  const [expanded, setExpanded] = useState(false);
  const CoverIcon = pickCoverIcon(project);
  const coverTheme = COVER_THEMES[index % COVER_THEMES.length];

  return (
    <motion.article
      className="project-card tilt-card"
      variants={cardFadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className={`project-cover ${coverTheme}`}>
        <CoverIcon size={40} strokeWidth={1.6} />
        <span className="project-cover-tag">Case Study</span>
        <span className="project-cover-year">{project.year}</span>
      </div>

      <div className="project-card-body">
        <p className="project-card-kicker">{project.tag}</p>
        <h3>{project.title}</h3>
        <p className="project-card-teaser">{project.outcome}</p>

        <div className="stack-list">
          {project.stack.map((tool, i) => (
            <span key={tool} style={{ '--i': i }}>
              {tool}
            </span>
          ))}
        </div>

        <button
          type="button"
          className={`project-breakdown-toggle${expanded ? ' open' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <ChevronDown size={16} /> {expanded ? 'Hide the breakdown' : 'See the full breakdown'}
        </button>

        {expanded && (
          <div className="project-breakdown">
            <p>
              <strong>Problem:</strong> {project.problem}
            </p>
            <p>
              <strong>My Role:</strong> {project.role}
            </p>
            <p>
              <strong>Approach:</strong> {project.approach}
            </p>
            {project.impact && (
              <p className="project-impact">
                <strong>Impact:</strong> {project.impact}
              </p>
            )}
          </div>
        )}

        <div className="project-actions">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} /> {project.liveLabel || 'Live Demo'}
            </a>
          )}
          {project.codeUrl && (
            <a href={project.codeUrl} target="_blank" rel="noreferrer">
              <GitBranch size={17} /> Code
            </a>
          )}
          <a href={`/projects/${slugify(project.title)}`}>
            <ArrowUpRight size={17} /> Full case study
          </a>
        </div>
      </div>
    </motion.article>
  );
}
