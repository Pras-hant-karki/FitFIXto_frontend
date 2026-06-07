const products = [
  {
    title: "Pro Hex Dumbbell Set 5-50lbs",
    meta: "Dumbbells - IronCore",
    image: "/dumbbell.png",
    price: "$599",
    oldPrice: "$799",
    rating: "4.8",
    reviews: "312",
    discount: "-25%",
  },
  {
    title: "Olympic Power Rack PRO-X",
    meta: "Racks - TitanForge",
    image: "/rack.png",
    price: "$1299",
    oldPrice: "$1599",
    rating: "4.9",
    reviews: "187",
    discount: "-19%",
  },
  {
    title: "Premium Whey Isolate 5lb",
    meta: "Supplements - PureFuel",
    image: "/whey.png",
    price: "$79",
    oldPrice: "$99",
    rating: "4.7",
    reviews: "1204",
    discount: "-20%",
  },
  {
    title: "Commercial Treadmill T-9000",
    meta: "Cardio - RunForge",
    image: "/treadmill.png",
    price: "$2499",
    oldPrice: "$2999",
    rating: "4.6",
    reviews: "89",
    discount: "-17%",
    extraBadge: "REFURB",
  },
];

export function FeaturedEquipment() {
  return (
    <section className="home-section" id="shop">
      <div className="section-inner">
        <div className="section-heading">
          <p>New Arrivals</p>
          <h2>Featured Equipment</h2>
          <span>Hand-picked, verified and ready to ship from our Kathmandu warehouse.</span>
        </div>

        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.title}>
              <div className="product-media">
                <img src={product.image} alt={product.title} />
                <div className="product-badges">
                  <span className="badge-dark">Verified</span>
                  {product.extraBadge ? <span className="badge-dark">{product.extraBadge}</span> : null}
                  <span className="badge-sale">{product.discount}</span>
                </div>
                <button className="wishlist-button" type="button" aria-label={`Add ${product.title} to wishlist`}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                </button>
              </div>
              <div className="product-body">
                <p>{product.meta}</p>
                <h3>{product.title}</h3>
                <div className="rating-line">
                  <span aria-hidden="true">&#9733;</span>
                  <strong>{product.rating}</strong>
                  <small>({product.reviews})</small>
                </div>
                <div className="price-line">
                  <strong>{product.price}</strong>
                  <del>{product.oldPrice}</del>
                </div>
                <button className="cart-button" type="button">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6h15l-1.5 8.5H8L6 3H3" />
                    <circle cx="9" cy="20" r="1.5" />
                    <circle cx="18" cy="20" r="1.5" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
