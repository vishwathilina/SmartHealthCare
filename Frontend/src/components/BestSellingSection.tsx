import productToothpaste from "@/assets/product-toothpaste.jpg";
import productGel from "@/assets/product-gel.jpg";
import productToothbrush from "@/assets/product-toothbrush.jpg";
import { Plus, ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";

const products = [
  { name: "Toothpaste Bits", price: "From $8 / month", image: productToothpaste, label: "Add to Cart" },
  { name: "Get Collotion", price: "", image: productGel, label: "Explore" },
  { name: "Toothpaste Bits", price: "From $8 / month", image: productToothbrush, label: "Add to Cart" },
];

const BestSellingSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Shop our best-selling<br />products
            </h2>
            <p className="mt-2 text-sm text-muted-foreground font-body max-w-sm">
              Shop the best-selling items that everyone is raving about!
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <button className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </button>
            <button className="h-10 w-10 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity">
              <ArrowRight className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {products.map((p, i) => (
            <div key={i} className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 bg-muted overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" width={512} height={640} />
                {i === 1 && (
                  <span className="absolute top-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-body font-semibold text-primary-foreground">
                    {p.name}
                  </span>
                )}
              </div>
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-body text-sm font-semibold text-foreground">{p.name}</h3>
                  {p.price && <p className="text-xs text-muted-foreground font-body">{p.price}</p>}
                </div>
                <button className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellingSection;
