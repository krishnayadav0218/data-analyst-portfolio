import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Star, Users, GitCommitHorizontal } from 'lucide-react';

// Pulls real, live numbers straight from GitHub's public API — no backend,
// no token needed, and nothing fabricated: whatever shows here is whatever
// the GitHub profile actually has right now.
export default function GitHubStats({ username }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    async function load() {
      try {
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (!userRes.ok) throw new Error('GitHub user fetch failed');
        const user = await userRes.json();

        const reposRes = await fetch(
          `https://api.github.com/users/${username}/repos?per_page=100`
        );
        const repos = reposRes.ok ? await reposRes.json() : [];
        const totalStars = Array.isArray(repos)
          ? repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0)
          : 0;

        if (!cancelled) {
          setStats({
            publicRepos: user.public_repos ?? 0,
            followers: user.followers ?? 0,
            totalStars,
          });
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (error || !username) return null;

  const items = [
    { icon: GitCommitHorizontal, label: 'Public repos', value: stats?.publicRepos },
    { icon: Star, label: 'Repo stars', value: stats?.totalStars },
    { icon: Users, label: 'Followers', value: stats?.followers },
  ];

  return (
    <motion.div
      className="github-stats"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
    >
      {items.map((item) => (
        <div className="github-stat" key={item.label}>
          <item.icon size={20} />
          <strong>{stats ? item.value : '—'}</strong>
          <span>{item.label}</span>
        </div>
      ))}
      <a
        className="github-stat github-stat-link"
        href={`https://github.com/${username}`}
        target="_blank"
        rel="noreferrer"
      >
        <GitBranch size={20} />
        <span>View GitHub profile</span>
      </a>
    </motion.div>
  );
}
