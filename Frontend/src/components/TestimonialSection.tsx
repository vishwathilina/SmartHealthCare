import { CalendarCheck, Download } from "lucide-react";

const TestimonialSection = () => {
  return (
    <section className="py-20 bg-muted/40">
      <div className="container mx-auto text-center">
        {/* Avatars */}
        <div className="flex justify-center -space-x-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-primary/30 border-2 border-background" />
          ))}
        </div>
        <p className="text-sm text-muted-foreground font-body">+98k happy Customer</p>
        <h2 className="mt-4 font-display text-3xl md:text-4xl font-bold text-foreground">
          The choice of creative people
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="#" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity">
            <CalendarCheck className="h-4 w-4" /> Schedule an appointment
          </a>
          <a href="#" className="inline-flex items-center gap-2 rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground font-body hover:bg-foreground hover:text-background transition-colors">
            <Download className="h-4 w-4" /> Download App
          </a>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
