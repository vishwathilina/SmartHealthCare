import medicalTeam from "@/assets/medical-team.jpg";
import { Play, ArrowRight } from "lucide-react";

const awards = [
  { title: "Medical Medal of Excellence", link: "#" },
  { title: "Project of the Year for Health Care", link: "#" },
];

const AwardsSection = () => {
  return (
    <section className="py-20 bg-muted/40">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Our awards & recognition
          </h2>
          <p className="mt-3 text-sm text-muted-foreground font-body max-w-md">
            We are proud of the awards that highlight our contributions at the fields of biotechnology and medicine.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          {/* Featured award card */}
          <div className="relative rounded-2xl overflow-hidden">
            <img src={medicalTeam} alt="Medical team" className="w-full h-48 object-cover" loading="lazy" width={640} height={512} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40 flex flex-col justify-end p-6">
              <h3 className="font-display text-lg font-bold text-primary-foreground">Global Vaccination Leader</h3>
              <p className="text-xs text-primary-foreground/80 font-body mt-1">Recognizing our contribution to the global vaccination effort.</p>
              <button className="mt-3 self-end h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors">
                <Play className="h-4 w-4 text-primary-foreground fill-current" />
              </button>
            </div>
          </div>
          {awards.map((a) => (
            <div key={a.title} className="flex items-center justify-between rounded-2xl border border-border bg-card px-6 py-4 hover:shadow-md transition-shadow">
              <span className="font-body text-sm font-medium text-foreground">{a.title}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AwardsSection;
