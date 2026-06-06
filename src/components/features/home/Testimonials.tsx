const testimonials = [
  {
    name: "Bishal R.",
    text: "Built out my entire home gym with FitFIXto. Equipment is bulletproof and the install team was top tier.",
  },
  {
    name: "Priya M.",
    text: "My trainer Aria changed how I think about training. Down 22 lbs in 5 months with zero burnout.",
  },
  {
    name: "Kiran T.",
    text: "Sauna install was clean, fast and exactly to spec. Will book again for maintenance.",
  },
];

export function Testimonials() {
  return (
    <section className="home-section" id="reviews">
      <div className="section-inner">
        <div className="section-heading compact">
          <p>Real Talk</p>
          <h2>What lifters say</h2>
        </div>

        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card" key={testimonial.name}>
              <div className="stars" aria-label="5 star review">
                &#9733;&#9733;&#9733;&#9733;&#9733;
              </div>
              <p>&quot;{testimonial.text}&quot;</p>
              <div>
                <strong>{testimonial.name}</strong>
                <span>Verified</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
