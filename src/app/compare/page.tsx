import Link from "next/link";
import { Plus } from "lucide-react";

const compareSlots = Array.from({ length: 3 }, (_, index) => index);
const compareRows = ["Brand", "Price", "Rating", "Condition", "Warranty", "Capacity", "Weight", "Dimensions", "Verified"];

export default function ComparePage() {
  return (
    <section className="compare-page">
      <header className="compare-header">
        <h1>Compare Products</h1>
        <p>Compare up to 5 products side-by-side. Click Add Product to pick one from the shop.</p>
      </header>

      <div className="compare-slots" aria-label="Products selected for comparison">
        {compareSlots.map((slot) => (
          <button type="button" className="compare-add-card" key={slot}>
            <Plus aria-hidden="true" />
            <span>Add Product</span>
          </button>
        ))}
      </div>

      <div className="compare-table" aria-label="Product comparison table">
        {compareRows.map((row) => (
          <div className="compare-row" key={row}>
            <strong>{row}</strong>
            {compareSlots.map((slot) => (
              <span key={`${row}-${slot}`}>—</span>
            ))}
          </div>
        ))}
      </div>

      <button type="button" className="compare-add-more">
        + Add more products (3/5)
      </button>

      <Link href="/shop" className="compare-back-link">
        ← Back to shop
      </Link>
    </section>
  );
}
