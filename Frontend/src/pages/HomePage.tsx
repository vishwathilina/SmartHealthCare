import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <section>
            <h1 className="text-4xl font-bold leading-tight">
              Smart Healthcare Triage
              <span className="text-primary"> Assistant</span>
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Manage elderly profiles, talk with the triage assistant, attach images, and automatically alert hospitals when symptoms are critical.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/login">
                Login
              </Link>
              <Link className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold" to="/register">
                Register
              </Link>
              <Link className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700" to="/emergency">
                Emergency PIN
              </Link>
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-semibold">Caregiver flow</div>
              <div className="mt-2 text-xs text-muted-foreground">1. Create profiles (elderly). 2. Assign hospital. 3. Use chat/image/voice triage.</div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-sm font-semibold">Hospital dashboard</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Hospitals can sign up and view critical alerts assigned to them.
            </p>
            <div className="mt-6 flex">
              <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to="/login">
                Hospital Login
              </Link>
            </div>
            <div className="mt-6 text-xs text-muted-foreground">
              Note: If you register as a hospital, you’ll be redirected to the hospital alerts page.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

