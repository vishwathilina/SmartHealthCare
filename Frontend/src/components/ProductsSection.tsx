import { Stethoscope, Pill, Syringe, FlaskConical, Microscope } from "lucide-react";

const categories = [
  { icon: Stethoscope, label: "Medical Devices" },
  { icon: Pill, label: "Medicines", active: true },
  { icon: Syringe, label: "Vaccines" },
  { icon: Microscope, label: "Biotechnological kits" },
  { icon: FlaskConical, label: "Biological products" },
];

const ProductsSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Explore our key products<br />and achievements
        </h2>
        <p className="mt-3 text-sm text-muted-foreground font-body">Explore now</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {categories.map((cat) => (
            <div
              key={cat.label}
              className={`flex flex-col items-center gap-3 rounded-2xl border px-8 py-6 transition-all font-body text-sm font-medium
                ${cat.active
                  ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-md"
                }`}
            >
              <cat.icon className="h-6 w-6" />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
