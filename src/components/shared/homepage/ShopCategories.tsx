const categories = [
  { name: "Dumbbells", count: "42 products", image: "/assets/kb-1781598197053-944053958.png" },
  { name: "Racks", count: "18 products", image: "/assets/ctabanner.png" },
  { name: "Cardio", count: "27 products", image: "/assets/treadmill-1781599301281-45451304.png" },
  { name: "Supplements", count: "84 products", image: "/assets/foamroller-1781599382642-162912921.png" },
  { name: "Benches", count: "23 products", image: "/assets/kb-1781598430146-785705924.png" },
  { name: "Barbells", count: "19 products", image: "/assets/crosstrainers-1781599442225-202990302.png" },
];

export function ShopCategories() {
  return (
    <section className="home-section section-soft" id="categories">
      <div className="section-inner">
        <div className="section-heading compact">
          <p>Shop The Floor</p>
          <h2>Shop by Category</h2>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <a className="category-card" href="#" key={category.name}>
              <img src={category.image} alt={category.name} />
              <span className="category-shade" />
              <strong>{category.name}</strong>
              <small>{category.count}</small>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
