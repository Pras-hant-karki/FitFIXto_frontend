export function TrainerBanner() {
  return (
    <section className="trainer-banner" id="trainers">
      <div className="trainer-banner-content">
        <p>Train With The Best</p>
        <h2>Elite coaches. Real results.</h2>
        <span>Book certified personal trainers, online or in-person. Programs built around your goals, schedule and equipment.</span>
        <div className="trainer-banner-actions">
          <a className="button button-light" href="/trainers">
            Find Your Trainer <span aria-hidden="true">-&gt;</span>
          </a>
          <a className="button trainer-apply-button" href="/trainers/apply">
            Apply for Trainer
          </a>
        </div>
      </div>
    </section>
  );
}
