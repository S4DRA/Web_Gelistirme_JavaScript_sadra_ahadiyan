import Link from "next/link";
import { HeaderScrollState, LogoJourneyHero } from "./landing-motion";

export default function Home() {
  return (
    <main className="studio-landing-page logo-only-landing-page">
      <HeaderScrollState />
      <LogoJourneyHero />
      <LogoJourneyFooter />
    </main>
  );
}

function LogoJourneyFooter() {
  return (
    <footer className="logo-journey-footer" aria-labelledby="logo-journey-footer-heading">
      <div className="logo-journey-footer-inner">
        <div>
          <p className="studio-kicker">Dampener</p>
          <h2 id="logo-journey-footer-heading">Financial clarity, mapped through one system.</h2>
        </div>
        <nav aria-label="Landing footer navigation">
          <Link href="/demo">Demo</Link>
          <Link href="/request-access">Request Access</Link>
          <Link href="/login">Login</Link>
        </nav>
      </div>
    </footer>
  );
}
