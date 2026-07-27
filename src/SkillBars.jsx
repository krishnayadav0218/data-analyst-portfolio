import { motion } from 'framer-motion';

const containerVariant = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const rowVariant = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function SkillBars({ skills }) {
  if (!Array.isArray(skills) || !skills.length) return null;

  return (
    <motion.div
      className="skill-bars"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariant}
    >
      {skills.map((skill) => (
        <motion.div className="skill-bar-row" key={skill.name} variants={rowVariant}>
          <div className="skill-bar-label">
            <span>{skill.name}</span>
            <span>{skill.level}%</span>
          </div>
          <div className="skill-bar-track">
            <motion.div
              className="skill-bar-fill"
              initial={{ width: '0%' }}
              whileInView={{ width: `${skill.level}%` }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
