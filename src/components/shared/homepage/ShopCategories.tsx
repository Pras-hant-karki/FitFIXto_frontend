const categories = [
  { name: "Dumbbells", count: "42 products", image: "/category-dumbbells.png" },
  { name: "Racks", count: "18 products", image: "/category-racks.png" },
  { name: "Cardio", count: "27 products", image: "/category-cardio.png" },
  { name: "Supplements", count: "84 products", image: "/category-supplements.png" },
  { name: "Benches", count: "23 products", image: "/category-benches.png" },
  { name: "Barbells", count: "19 products", image: "/category-barbells.png" },
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
