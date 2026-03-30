import heroImg from "@/assets/hero-smile.jpg";
import { Play, CalendarCheck } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-hero-bg">
      <div className="container mx-auto grid md:grid-cols-2 items-center gap-8 py-12 md:py-16">
        {/* Left */}
        <div className="relative z-10 flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-badge-bg px-4 py-1.5 text-xs font-semibold text-badge-text font-body">
            <Play className="h-3 w-3 fill-current" /> NFT Product Launch
          </span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
            Daily Dental Care for<br />a Healthy Smile
          </h1>
          <div className="flex flex-wrap gap-3">
            <a href="#" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background font-body hover:opacity-90 transition-opacity">
              <Play className="h-4 w-4" /> Download App
            </a>
            <a href="#" className="inline-flex items-center gap-2 rounded-full border border-foreground px-6 py-3 text-sm font-medium text-foreground font-body hover:bg-foreground hover:text-background transition-colors">
              <CalendarCheck className="h-4 w-4" /> Schedule an appointment
            </a>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-primary/20 border-2 border-background" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-body">
              We are ready to serve you with<br />pleasure and fast response
            </p>
          </div>
        </div>

        {/* Right – hero image */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
            <img
              src={heroImg}
              alt="Healthy smile"
              className="w-full h-[400px] md:h-[480px] object-cover object-top"
              width={1024}
              height={768}
            />
          </div>
          {/* Floating stat card */}
          <div className="absolute top-6 right-6 rounded-2xl bg-background shadow-lg px-5 py-3 flex items-center gap-3">
            <span className="font-display text-3xl font-bold text-foreground">90</span>
            <span className="text-[10px] text-muted-foreground font-body leading-tight">out of<br />100</span>
          </div>
          {/* Bottom bar */}
          <div className="absolute bottom-4 right-4 rounded-full bg-primary/90 backdrop-blur px-4 py-2 flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-5 rounded-full bg-primary-foreground/30 border border-primary" />
              ))}
            </div>
            <span className="text-[10px] text-primary-foreground font-body font-medium">Healthy Smile</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
