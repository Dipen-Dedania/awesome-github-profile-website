import FaqSection from './FaqSection.jsx';

const OFFICIAL_DOC_URL =
  'https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site';

const setupSteps = [
  {
    badge: 'Step 1',
    title: 'Find a Template You Like',
    body:
      'Open Templates Gallery and shortlist 2-3 templates that match your style, stack, and content needs. Use stars and recent updates as quality signals.',
    detail:
      'Tip: Start with one simple template and launch fast. You can redesign once your content is live.',
  },
  {
    badge: 'Step 2',
    title: 'Fork or Clone the Template Repository',
    body:
      'Open the template source repository, then either fork it to your GitHub account or clone it directly to your local machine.',
    code: `git clone https://github.com/<template-owner>/<template-repo>.git
cd <template-repo>`,
  },
  {
    badge: 'Step 3',
    title: 'Customize Content and Branding',
    body:
      'Update your name, bio, social links, projects, and theme colors. Replace placeholder assets before publishing.',
    detail:
      'Tip: Search for values like "Your Name", "TODO", or sample usernames to quickly find what to edit.',
  },
  {
    badge: 'Step 4',
    title: 'Push to Your GitHub Repository',
    body:
      'Create a fresh repository (or use your fork), commit your changes, and push your code to the default branch.',
    code: `git add .
git commit -m "Customize profile website"
git push origin main`,
  },
  {
    badge: 'Step 5',
    title: 'Enable GitHub Pages',
    body:
      'In your repository Settings, open Pages and configure a publishing source. You can deploy from a branch/folder or from a GitHub Actions workflow.',
    detail:
      'GitHub Pages needs an entry file at the source root: index.html, index.md, or README.md. Initial publish can take up to about 10 minutes.',
  },
];

const SETUP_FAQ_ITEMS = [
  {
    question: 'What is the minimum required file for GitHub Pages?',
    answer:
      'Your publishing source should include an entry file such as index.html, index.md, or README.md at the configured root.',
  },
  {
    question: 'Can I deploy from a subfolder in a repository?',
    answer:
      'Yes. GitHub Pages supports publishing from a branch and folder, or from a GitHub Actions workflow for custom build outputs.',
  },
  {
    question: 'How do I force HTTPS for my custom domain?',
    answer:
      'After DNS is configured correctly, enable the HTTPS option in GitHub Pages settings to serve your site securely.',
  },
];

export default function SetupGuide({ onBrowseTemplates }) {
  return (
    <section className="setup-view animation-fade-in">
      <div className="setup-hero">
        <span className="setup-chip">Launch Guide</span>
        <h2 className="setup-title">
          Set Up Your Profile Site on <span className="title-gradient">GitHub Pages</span>
        </h2>
        <p className="setup-subtitle">
          Use this repo to discover a design you love, clone the template source, customize it, and publish with GitHub Pages.
        </p>
        <div className="setup-actions">
          <button className="btn-primary" onClick={onBrowseTemplates}>
            Browse Templates
          </button>
          <a
            className="setup-secondary-btn"
            href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Curated Repo
          </a>
          <a
            className="setup-secondary-btn"
            href={OFFICIAL_DOC_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Official GitHub Docs
          </a>
        </div>
      </div>

      <article className="setup-card setup-reference">
        <div className="setup-card-badge">Official Reference</div>
        <h3 className="setup-card-title">Keep This as Fallback</h3>
        <p className="setup-card-body">
          We follow GitHub&apos;s official Pages flow, but if GitHub updates the UI or deployment options, use the official guide for the latest source of truth.
        </p>
        <a
          className="setup-secondary-btn"
          href={OFFICIAL_DOC_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open: Creating a GitHub Pages Site
        </a>
      </article>

      <div className="setup-grid">
        {setupSteps.map((step) => (
          <article key={step.title} className="setup-card">
            <div className="setup-card-badge">{step.badge}</div>
            <h3 className="setup-card-title">{step.title}</h3>
            <p className="setup-card-body">{step.body}</p>
            {step.code ? <pre className="setup-code-block">{step.code}</pre> : null}
            {step.detail ? <p className="setup-card-detail">{step.detail}</p> : null}
          </article>
        ))}
      </div>

      <FaqSection title="GitHub Pages Setup FAQs" items={SETUP_FAQ_ITEMS} />
    </section>
  );
}
