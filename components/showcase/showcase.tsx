// SHOW-1. The public showcase, a server component with no client JavaScript. Every word comes from
// content/showcase.ts. Links into the demo are plain <a> tags: the demo has its own styles, so the
// browser loads it fresh (and proxy.ts sends visitors without a code to /access).
import { ArrowDown, ArrowRight, Calculator, Database, EyeOff, FlaskConical, ListChecks, Mail, MonitorSmartphone, ScanText, Server, ShieldCheck, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { accessMailto, showcase } from "@/content/showcase";

const { hero, nav, problem, how, engine, privacy, screens, team, footer } = showcase;

const TINTS = ["pink", "sage", "blue", "peach"] as const;
const MOTIFS = ["heart", "star", "cross", "triangle"] as const;

function Motif({ i }: { i: number }) {
  return <span className={`motif motif--${MOTIFS[i % MOTIFS.length]}`} aria-hidden="true" />;
}

function SectionHead({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="section__head">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {children}
    </div>
  );
}

export function Showcase() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Hero />
        <Problem />
        <HowItWorks />
        <UnderTheHood />
        <Privacy />
        <Screens />
        <Team />
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="wrap site-header__inner">
        <a className="wordmark" href="#top" aria-label={`${hero.name}, back to top`}>
          <span className="wordmark__leaf" aria-hidden="true" />
          {hero.name}
        </a>
        <nav className="site-nav" aria-label="Sections">
          {nav.map((n) => (
            <a key={n.href} href={n.href}>
              {n.label}
            </a>
          ))}
        </nav>
        <a className="btn" href={accessMailto()}>
          {hero.primaryCta}
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const { art } = hero;
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div>
          <p className="badge">{hero.badge}</p>
          <h1 id="hero-title">{hero.name}</h1>
          <p className="hero__tagline">{hero.tagline}</p>
          <p className="hero__context">{hero.context}</p>
          <div className="hero__actions">
            <a className="btn" href={accessMailto()}>
              <Mail size={18} aria-hidden="true" />
              {hero.primaryCta}
            </a>
            <a className="btn btn--outline" href="#how-it-works">
              {hero.secondaryCta}
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
          <p className="hero__code">
            {hero.haveCode} <a href="/demo">{hero.openDemo}</a>
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="card tint--pink hero-art__verdict">
            <Motif i={0} />
            <p className="label">{art.label}</p>
            <strong>{art.verdict}</strong>
            <div className="hero-art__chips">
              {art.options.map((o) => (
                <span key={o} aria-current={o === art.verdict ? "true" : undefined}>
                  {o}
                </span>
              ))}
            </div>
            <p className="hero-art__note">{art.note}</p>
          </div>
          <div className="hero-art__row">
            {art.cards.map((c, i) => (
              <div key={c.title} className={`card tint--${TINTS[i + 1]}`}>
                <Motif i={i + 1} />
                <strong>{c.title}</strong>
                <span>{c.body}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="section band--surface" aria-labelledby="problem">
      <div className="wrap">
        <SectionHead id="problem" eyebrow={problem.eyebrow} title={problem.title} />
        <blockquote className="challenge">
          <p>{problem.challenge}</p>
          <cite>— {problem.challengeSource}</cite>
        </blockquote>
        <p className="framing">{problem.framing}</p>
        <ol className="points">
          {problem.points.map((p) => (
            <li key={p.title} className="card">
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </li>
          ))}
        </ol>
        <ul className="figures" aria-label="The need, in numbers">
          {problem.figures.map((f, i) => (
            <li key={f.value} className={`card figure tint--${TINTS[i]}`}>
              <Motif i={i} />
              <p className="figure__value">{f.value}</p>
              <p className="figure__label">{f.label}</p>
              <p className="figure__source">Source: {f.source}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="section" aria-labelledby="how-it-works">
      <div className="wrap">
        <SectionHead id="how-it-works" eyebrow={how.eyebrow} title={how.title}>
          <p>{how.intro}</p>
        </SectionHead>
        <ol className="layers">
          {how.layers.map((l, i) => (
            <li key={l.who} className={`card layer tint--${TINTS[i]}`}>
              <Motif i={i} />
              <span className="layer__who">{l.who}</span>
              <h3>{l.title}</h3>
              <p>{l.body}</p>
              <span className="layer__step" aria-hidden="true">
                {i + 1} / {how.layers.length}
              </span>
            </li>
          ))}
        </ol>
        <p className="flow">
          <ArrowRight size={22} aria-hidden="true" />
          {how.flowNote}
        </p>
      </div>
    </section>
  );
}

const ENGINE_ICONS = [ListChecks, ShieldCheck, Sparkles, Calculator];

function UnderTheHood() {
  const a = engine.architecture;
  return (
    <section className="section band--ink" aria-labelledby="under-the-hood">
      <div className="wrap">
        <SectionHead id="under-the-hood" eyebrow={engine.eyebrow} title={engine.title}>
          <p>{engine.intro}</p>
        </SectionHead>
        <ul className="engine-grid">
          {engine.steps.map((s, i) => {
            const Icon = ENGINE_ICONS[i] ?? ListChecks;
            return (
              <li key={s.title} className="engine-step">
                <Icon size={26} aria-hidden="true" />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            );
          })}
        </ul>

        <figure className="arch" aria-labelledby="arch-title">
          <h3 id="arch-title">{a.title}</h3>
          <div className="arch__grid">
            <div className="arch__box">
              <h4>
                <MonitorSmartphone size={18} aria-hidden="true" /> {a.browser.label}
              </h4>
              <ul>
                {a.browser.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <Arrow label="sends answers and slider values; receives results" />
            <div className="arch__box arch__box--server">
              <h4>
                <Server size={18} aria-hidden="true" /> {a.server.label}
              </h4>
              <ul>
                {a.server.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <Arrow label="reads and writes" />
            <div className="arch__stack">
              {a.data.map((d, i) => (
                <div key={d.label} className={`arch__box tint--${i === 0 ? "pink" : "sage"}`}>
                  <h4>
                    <Database size={18} aria-hidden="true" /> {d.label}
                  </h4>
                  <p>{d.note}</p>
                </div>
              ))}
              <div className="arch__box tint--blue">
                <h4>
                  <Sparkles size={18} aria-hidden="true" /> {a.ai.label}
                </h4>
                <p>{a.ai.note}</p>
              </div>
            </div>
          </div>
          <figcaption>{a.caption}</figcaption>
        </figure>

        <div className="stack-row">
          <div>
            <h3>Stack</h3>
            <ul className="chips">
              {engine.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="cost-figure">
            <strong>{engine.costFigure.value}</strong>
            <span>{engine.costFigure.label}</span>
            <small>Source: {engine.costFigure.source}</small>
          </p>
        </div>
      </div>
    </section>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="arch__arrow">
      <ArrowRight size={22} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

const PRIVACY_ICONS = [EyeOff, UsersRound, ShieldCheck, ScanText, UserRoundCheck, FlaskConical];

function Privacy() {
  return (
    <section className="section" aria-labelledby="privacy">
      <div className="wrap">
        <SectionHead id="privacy" eyebrow={privacy.eyebrow} title={privacy.title} />
        <ul className="privacy-grid">
          {privacy.points.map((p, i) => {
            const Icon = PRIVACY_ICONS[i] ?? ShieldCheck;
            return (
              <li key={p.title} className="card">
                <Icon size={26} aria-hidden="true" />
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Screens() {
  return (
    <section className="section band--surface" aria-labelledby="screens">
      <div className="wrap">
        <SectionHead id="screens" eyebrow={screens.eyebrow} title={screens.title} />
        <ul className="shots">
          {screens.shots.map((s) => (
            <li key={s.src}>
              <figure className="shot">
                {/* eslint-disable-next-line @next/next/no-img-element -- static files from public/showcase, swapped by hand */}
                <img src={s.src} alt={s.alt} width={1600} height={1000} loading="lazy" decoding="async" />
                <figcaption>{s.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

function Team() {
  return (
    <section className="section" aria-labelledby="team">
      <div className="wrap">
        <SectionHead id="team" eyebrow={team.eyebrow} title={team.title} />
        <ul className="team">
          {team.members.map((m, i) => (
            <li key={m.name} className="card member">
              <span className={`member__avatar tint--${TINTS[i % TINTS.length]}`} aria-hidden="true">
                {m.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- static files from public/team, swapped by hand
                  <img src={m.photo} alt="" width={56} height={56} loading="lazy" decoding="async" />
                ) : (
                  initials(m.name)
                )}
              </span>
              <h3>{m.name}</h3>
              <p className="member__role">{m.role}</p>
              <p>{m.detail}</p>
              {(m.linkedin || m.github) && (
                <p className="member__links">
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn<span className="sr-only"> profile of {m.name} (opens in a new tab)</span>
                    </a>
                  )}
                  {m.github && (
                    <a href={m.github} target="_blank" rel="noopener noreferrer">
                      GitHub<span className="sr-only"> profile of {m.name} (opens in a new tab)</span>
                    </a>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer band--ink">
      <div className="wrap">
        <div className="site-footer__cta">
          <div>
            <h2>{footer.ctaTitle}</h2>
            <p className="site-footer__lead">{footer.ctaBody}</p>
          </div>
          <div className="actions">
            <a className="btn btn--light" href={accessMailto()}>
              <Mail size={18} aria-hidden="true" />
              {hero.primaryCta}
            </a>
            <a className="btn btn--outline" href="/demo">
              {hero.openDemo}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="site-footer__legal">
          <p>{footer.copyright}</p>
          <p>{footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
