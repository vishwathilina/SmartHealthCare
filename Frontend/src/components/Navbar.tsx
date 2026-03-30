import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">I</span>
            IBNESINA
          </a>
          <div className="hidden md:flex items-center gap-6 font-body text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Home</a>
            <a href="#" className="hover:text-foreground transition-colors">Contribution</a>
            <a href="#" className="hover:text-foreground transition-colors">Our Mission</a>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 font-body text-sm font-medium text-muted-foreground">
          <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
            Solutions <ChevronDown className="h-4 w-4" />
          </a>
          <a href="#" className="flex items-center gap-1 hover:text-foreground transition-colors">
            Projects <ChevronDown className="h-4 w-4" />
          </a>
          <a href="#" className="rounded-full bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity">
            Contact Us
          </a>
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 flex flex-col gap-3 font-body text-sm">
          <a href="#">Home</a>
          <a href="#">Contribution</a>
          <a href="#">Our Mission</a>
          <a href="#">Solutions</a>
          <a href="#">Projects</a>
          <a href="#" className="mt-2 rounded-full bg-primary px-5 py-2.5 text-center text-primary-foreground">Contact Us</a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
