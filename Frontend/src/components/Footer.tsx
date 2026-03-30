import { Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-16">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">I</span>
              IBNESINA
            </a>
            <div className="mt-4 flex gap-3">
              <a href="#" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Instagram className="h-3.5 w-3.5" />
              </a>
              <a href="#" className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Youtube className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-6 text-xs text-muted-foreground font-body leading-relaxed max-w-xs">
              Subscribe to the newsletter<br />the give you the latest<br />Fashion Items & Events
            </p>
            <div className="mt-3 flex">
              <input
                type="email"
                placeholder="Email"
                className="rounded-l-full border border-border bg-muted px-4 py-2 text-xs font-body outline-none focus:ring-1 focus:ring-primary w-40"
              />
              <button className="rounded-r-full bg-primary px-4 py-2 text-xs font-body text-primary-foreground hover:opacity-90 transition-opacity">
                →
              </button>
            </div>
          </div>

          {/* Links */}
          {[
            { title: "Company", items: ["People platform", "Collaborative", "Employee Benefits", "Hiring and onboarding", "Talent management"] },
            { title: "Features", items: ["Primary care", "Telehealth", "Leadership", "Services", "Integrations"] },
            { title: "Solutions", items: ["CareOther+", "healthBridge", "VitalX", "Global Business", "Healthcare Article & Blogs"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-body text-sm font-semibold text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs text-muted-foreground font-body hover:text-foreground transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-body">
            © All rights reserved 2025<br />Designed with Lovable
          </p>
          <div className="flex gap-8 text-xs text-muted-foreground font-body">
            <div>
              <p className="font-medium text-foreground">Discover In</p>
              <p>Paris, France</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Contact</p>
              <p>+4(96) 461 793..</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Our Address</p>
              <p>58 Rue de Fonteny Paris France</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
