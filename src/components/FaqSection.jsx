export default function FaqSection({ title, items }) {
  if (!items?.length) return null;

  return (
    <section className="faq-section" aria-label={title}>
      <h2 className="faq-title">{title}</h2>
      <div className="faq-list">
        {items.map((item) => (
          <details key={item.question} className="faq-item">
            <summary className="faq-question">{item.question}</summary>
            <p className="faq-answer">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
