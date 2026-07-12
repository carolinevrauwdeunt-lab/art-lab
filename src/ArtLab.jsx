import ParticleTulipHero from "./ParticleTulipHero.jsx";
import WireframeLionPlate from "./WireframeLionPlate.jsx";
import "./artlab.css";

const LINKS = {
  mail: "mailto:caroline.vrauwdeunt@gmail.com",
  github: "https://github.com/carolinevrauwdeunt-lab",
  instagram: "https://www.instagram.com/cvoriginal.photography",
  linkedin: "https://www.linkedin.com/in/carolinevrauwdeunt",
};

function Schematic({ nodes, label }) {
  return (
    <>
      <nav className="schematic" aria-label={label}>
        <span className="wire" />
        {nodes.map((n) => (
          <span key={n.text} style={{ display: "contents" }}>
            {n.href ? (
              <a
                className="node"
                href={n.href}
                target={n.href.startsWith("http") ? "_blank" : undefined}
                rel={n.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {n.text}
                <sup>{n.ref}</sup>
              </a>
            ) : (
              <span className="node">
                {n.text}
                <sup>{n.ref}</sup>
              </span>
            )}
            <span className="wire" />
          </span>
        ))}
      </nav>
      <p className="schematic-label">{label}</p>
    </>
  );
}

function PlateArt({ seed }) {
  // faint construction geometry, varied a little per plate
  const cx = 200;
  const cy = 150;
  const r = 66 + (seed % 3) * 14;
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <g stroke="rgba(230,225,211,0.16)" strokeWidth="1" fill="none">
        <line x1="0" y1="0" x2="400" y2="300" />
        <line x1="400" y1="0" x2="0" y2="300" />
        <circle cx={cx} cy={cy} r={r} strokeDasharray="4 5" />
        <circle cx={cx} cy={cy} r={r * 0.55} />
      </g>
      <g stroke="rgba(230,225,211,0.42)" strokeWidth="1">
        <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} />
        <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} />
      </g>
      <g stroke="rgba(210,169,95,0.5)" strokeWidth="1" fill="none">
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r}`} />
      </g>
    </svg>
  );
}

function LivePlate({ fig, title, medium, children, portrait }) {
  return (
    <figure className="plate" style={{ margin: 0 }}>
      <div className={"plate-frame" + (portrait ? " portrait" : "")}>{children}</div>
      <figcaption className="plate-caption">
        <b>FIG. {fig}</b>
        <span>{title}</span>
        <span>{medium}</span>
      </figcaption>
    </figure>
  );
}

function Plate({ fig, title, seed }) {
  return (
    <figure className="plate" style={{ margin: 0 }}>
      <div className="plate-frame">
        <PlateArt seed={seed} />
        <div className="await">
          <b>PLATE RESERVED</b>
          <span>NEW WORK IN PREPARATION</span>
        </div>
      </div>
      <figcaption className="plate-caption">
        <b>FIG. {fig}</b>
        <span>{title}</span>
        <span>STATUS: PENDING</span>
      </figcaption>
    </figure>
  );
}

export default function ArtLab() {
  return (
    <main className="lab">
      <section className="hero">
        <ParticleTulipHero />
        <div className="hero-overlay">
          <span className="reg tl" />
          <span className="reg tr" />
          <span className="reg bl" />
          <span className="reg br" />
          <h1 className="wordmark">
            CAROLINE&rsquo;S ART LAB
            <small>EXPERIMENTS IN IMAGE, LIGHT &amp; CODE</small>
          </h1>
          <div className="hero-titleblock">
            <div>
              <span>FIG.</span>
              <b>001</b>
            </div>
            <div>
              <span>TITLE</span>
              <b>TULIPA &times; AURORA</b>
            </div>
            <div>
              <span>MEDIUM</span>
              <b>8,146 LIGHT PARTICLES</b>
            </div>
            <div>
              <span>SCALE</span>
              <b>1 : 1</b>
            </div>
            <div>
              <span>INPUT</span>
              <b>CURSOR + TOUCH</b>
            </div>
          </div>
          <div className="scroll-cue">SECTION A&ndash;A</div>
        </div>
      </section>

      <Schematic
        label="SIGNAL ROUTING — EXTERNAL CONNECTIONS"
        nodes={[
          { text: "MAIL", ref: "J1", href: LINKS.mail },
          { text: "INSTAGRAM", ref: "J2", href: LINKS.instagram },
          { text: "GITHUB", ref: "J3", href: LINKS.github },
          { text: "ABOUT", ref: "J4", href: "#about" },
        ]}
      />

      <div className="section-head">
        <b>INDEX OF PLATES</b>
        <span>SHEET 1 OF 1 &mdash; REVISIONS ONGOING</span>
      </div>
      <p className="gen-note">
        NOTE &mdash; PLEASE TOUCH THIS ART.
      </p>

      <section className="plates">
        <LivePlate fig="002" title="LEO &times; TRIANGULATION" medium="162-NODE WIREFRAME MESH" portrait>
          <WireframeLionPlate />
        </LivePlate>
        <Plate fig="003" title="UNTITLED — IN STUDIO" seed={2} />
        <Plate fig="004" title="UNTITLED — SKETCH PHASE" seed={3} />
      </section>

      <Schematic
        label="AUXILIARY CIRCUITS"
        nodes={[
          { text: "LINKEDIN", ref: "J5", href: LINKS.linkedin },
          { text: "MAIL", ref: "J1", href: LINKS.mail },
        ]}
      />

      <section className="plates">
        <Plate fig="005" title="UNTITLED — CONCEPT" seed={4} />
        <Plate fig="006" title="UNTITLED — CONCEPT" seed={5} />
        <Plate fig="007" title="UNTITLED — CONCEPT" seed={6} />
      </section>

      <div className="section-head" id="about">
        <b>TITLE BLOCK / ABOUT</b>
        <span>GENERAL NOTES</span>
      </div>

      <section className="about">
        <dl className="about-block" style={{ margin: 0 }}>
          <div className="about-row">
            <dt>DRAWN BY</dt>
            <dd>Caroline Vrauwdeunt</dd>
          </div>
          <div className="about-row">
            <dt>PRACTICE</dt>
            <dd>
              An evolving collection of art experiments &mdash; photography, generative
              light, and code. Each plate on this sheet is a station where a new piece
              will appear; the drawing grows as the work does.
            </dd>
          </div>
          <div className="about-row">
            <dt>CURRENT WORK</dt>
            <dd>
              FIG. 001 &mdash; a tulip under the aurora, retraced as ~8,000 particles of
              gold and white light. Move your cursor through it.
            </dd>
          </div>
          <div className="about-row">
            <dt>CONTACT</dt>
            <dd>
              <a href={LINKS.mail}>caroline.vrauwdeunt@gmail.com</a>
            </dd>
          </div>
        </dl>
      </section>

      <footer className="foot">
        <span>&copy; 2026 CAROLINE VRAUWDEUNT</span>
        <span>ALL DIMENSIONS IN LIGHT UNLESS OTHERWISE NOTED</span>
        <span>REV. A &mdash; DO NOT SCALE DRAWING</span>
      </footer>
    </main>
  );
}
