import { useEffect } from 'react';
import { ArrowLeft, Database } from 'lucide-react';

function setMetaDescription(content) {
  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', 'description');
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function ContentBlock({ block, index }) {
  if (block.type === 'heading') {
    return <h2 key={index}>{block.text}</h2>;
  }
  if (block.type === 'list') {
    return (
      <ul key={index} className="blog-post-list">
        {block.items.map((item) => (
          <li key={item.slice(0, 40)}>{item}</li>
        ))}
      </ul>
    );
  }
  return (
    <p key={index} className="blog-post-paragraph">
      {block.text}
    </p>
  );
}

function BlogDetail({ post, profileName = 'Krishna Yadav' }) {
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!post) {
      document.title = `Post not found | ${profileName} - Data Analyst Portfolio`;
      return;
    }
    document.title = `${post.title} | ${profileName} - Data Analyst`;
    setMetaDescription(post.summary.slice(0, 156).trim());
  }, [post, profileName]);

  if (!post) {
    return (
      <main className="project-detail-page">
        <nav className="topbar" aria-label="Blog navigation">
          <div className="topbar-inner">
            <a className="brand" href="/" aria-label={`Back to ${profileName} portfolio home`}>
              <span>KY</span>
              <strong>{profileName}</strong>
            </a>
          </div>
        </nav>
        <section className="section">
          <h1>Post not found</h1>
          <p className="intro">This article link has moved or no longer exists.</p>
          <a className="primary-action" href="/">
            <ArrowLeft size={18} /> Back to portfolio
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="project-detail-page">
      <nav className="topbar" aria-label="Blog navigation">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label={`Back to ${profileName} portfolio home`}>
            <span>KY</span>
            <strong>{profileName}</strong>
          </a>
          <a className="secondary-action" href="/#blog">
            <ArrowLeft size={17} /> All articles
          </a>
        </div>
      </nav>

      <section className="section project-detail-hero">
        <p className="eyebrow">
          <Database size={16} /> {post.category} &middot; {post.readTime}
        </p>
        <h1>{post.title}</h1>
        <p className="intro">{post.summary}</p>
      </section>

      <section className="section project-detail-body">
        <article className="project-detail-block blog-post-block">
          {post.content?.map((block, index) => (
            <ContentBlock block={block} index={index} key={index} />
          ))}
        </article>

        <article className="project-detail-block">
          <h2>Written by {profileName}</h2>
          <p>
            {profileName} is a Data Analyst working with Power BI, SQL, and Python. Have a question about this topic?
            {' '}
            <a href="/#contact">Get in touch</a>.
          </p>
        </article>
      </section>
    </main>
  );
}

export default BlogDetail;
