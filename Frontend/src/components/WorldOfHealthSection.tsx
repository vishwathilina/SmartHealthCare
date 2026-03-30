import doctorImg from "@/assets/doctor-portrait.jpg";
import productToothbrush from "@/assets/product-toothbrush.jpg";

const WorldOfHealthSection = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center md:text-left">
          World of health
        </h2>
        <p className="mt-3 text-sm text-muted-foreground font-body max-w-lg text-center md:text-left">
          Embark on a trans-formative journey as you dive into the world of health with our commitment to your well-being that goes beyond...
        </p>

        <blockquote className="mt-10 max-w-xl border-l-2 border-primary pl-6 font-body text-sm text-foreground/80 italic">
          "Join us at the forefront of a wellness revolution. this is dedicated to unleashing the potential of personalize healthcare, ensuring that each step of your health is a testament of the extraordinary care."
        </blockquote>
        <p className="mt-3 font-body text-xs font-semibold text-foreground">Read More ●</p>

        {/* 3-card grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-4">
          {/* Card 1 – image */}
          <div className="rounded-2xl overflow-hidden bg-muted relative h-64">
            <img src={productToothbrush} alt="Healthcare product" className="w-full h-full object-cover" loading="lazy" width={512} height={640} />
            <div className="absolute bottom-3 left-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-xs font-body font-medium text-foreground">
              0 Feelings
            </div>
          </div>
          {/* Card 2 – purple */}
          <div className="rounded-2xl bg-primary p-6 flex flex-col justify-between h-64">
            <span className="inline-flex w-fit rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-body font-semibold text-primary-foreground">
              Friends
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-primary-foreground">Not Just<br />healthcare</h3>
              <p className="mt-2 text-xs text-primary-foreground/70 font-body">Explore now →</p>
            </div>
          </div>
          {/* Card 3 – specialist */}
          <div className="rounded-2xl bg-foreground p-6 flex flex-col justify-between h-64 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <img src={doctorImg} alt="Tara Johnson" className="h-10 w-10 rounded-full object-cover" loading="lazy" width={640} height={640} />
              <div>
                <p className="font-body text-sm font-semibold text-background">Tara Johnson</p>
                <span className="inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-body text-primary-foreground">Specialist</span>
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-background leading-snug">
                Redefines Precision and Compassion in Surgical Care!
              </h3>
              <p className="mt-2 text-xs text-background/50 font-body">www.ibnesina.com</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorldOfHealthSection;
