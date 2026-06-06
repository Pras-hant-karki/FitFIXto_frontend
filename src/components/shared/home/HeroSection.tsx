export function HeroSection() {
  return (
    <section className="hero-section" id="home" aria-label="FitFIXto hero">
      <div className="hero-content">
        <h1>Built for Strength</h1>
        <p>Premium equipment, expert installation, and professional trainers for serious results.</p>
        <div className="hero-actions">
          <a className="button button-primary" href="#shop">
            Shop Equipment
            <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button button-glass" href="#trainers">
            Hire a Trainer
          </a>
        </div>
      </div>
    </section>
  );
}
