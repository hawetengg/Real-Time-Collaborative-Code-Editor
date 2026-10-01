"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        fontFamily: "Inter, sans-serif",
        background: "#0a0a0f",
        color: "#e8e8f0",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        .nav { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(16px,5vw,80px); height: 64px; background: rgba(10,10,15,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .nav-logo { font-family: 'JetBrains Mono',monospace; font-weight: 600; font-size: 18px; color: #e8e8f0; display: flex; align-items: center; gap: 8px; }
        .nav-logo span { color: #5b6ef5; }
        .nav-links { display: flex; gap: 32px; align-items: center; }
        .nav-links a { font-size: 14px; color: #6e6e8a; transition: color 0.2s; }
        .nav-links a:hover { color: #e8e8f0; }
        .nav-cta { background: #5b6ef5 !important; color: #fff !important; padding: 8px 20px; border-radius: 8px; font-weight: 500; }
        .hero { max-width: 1200px; margin: 0 auto; padding: 100px clamp(16px,5vw,80px) 80px; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(91,110,245,0.12); border: 1px solid #5b6ef5; border-radius: 100px; padding: 5px 14px; font-size: 12px; font-family: 'JetBrains Mono',monospace; color: #5b6ef5; margin-bottom: 32px; letter-spacing: 0.04em; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        h1 { font-family: 'Syne',sans-serif; font-size: clamp(42px,7vw,88px); font-weight: 800; line-height: 1.0; letter-spacing: -0.03em; margin-bottom: 24px; }
        h1 em { font-style: normal; color: #5b6ef5; }
        .hero-sub { font-size: clamp(16px,2vw,20px); color: #6e6e8a; max-width: 560px; line-height: 1.7; margin-bottom: 48px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #5b6ef5; color: #fff; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; transition: box-shadow 0.2s, transform 0.15s; display: inline-block; }
        .btn-primary:hover { box-shadow: 0 0 32px rgba(91,110,245,0.4); transform: translateY(-1px); }
        .btn-secondary { background: #1a1a24; color: #e8e8f0; border: 1px solid rgba(255,255,255,0.07); padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 500; transition: border-color 0.2s; display: inline-block; }
        .btn-secondary:hover { border-color: #6e6e8a; }
        .editor-preview { max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px,5vw,80px); }
        .editor-window { background: #111118; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.4); }
        .editor-titlebar { display: flex; align-items: center; gap: 8px; padding: 14px 20px; background: #1a1a24; border-bottom: 1px solid rgba(255,255,255,0.07); }
        .dr { width: 12px; height: 12px; border-radius: 50%; }
        .editor-filename { margin-left: 12px; font-family: 'JetBrains Mono',monospace; font-size: 13px; color: #6e6e8a; }
        .editor-users { margin-left: auto; display: flex; }
        .avatar { width: 28px; height: 28px; border-radius: 50%; border: 2px solid #1a1a24; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; margin-left: -6px; color: #fff; }
        .editor-body { display: grid; grid-template-columns: 48px 1fr; }
        .line-nums { padding: 24px 12px 24px 8px; background: #111118; border-right: 1px solid rgba(255,255,255,0.07); font-family: 'JetBrains Mono',monospace; font-size: 13px; line-height: 1.8; color: #3a3a52; text-align: right; user-select: none; }
        .code-area { padding: 24px 28px; font-family: 'JetBrains Mono',monospace; font-size: 13px; line-height: 1.8; overflow-x: auto; white-space: pre; min-width: 0; }
        .kw{color:#c792ea} .fn{color:#82aaff} .str{color:#34d399} .cm{color:#3a3a52;font-style:italic}
        .cursor { display: inline-block; width: 2px; height: 1.1em; background: #f472b6; vertical-align: text-bottom; animation: blink 1s step-end infinite; position: relative; }
        .cursor::before { content: 'Sara'; position: absolute; top: -22px; left: 0; background: #f472b6; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; font-family: Inter,sans-serif; }
        @keyframes blink { 50%{opacity:0} }
        .stats { display: flex; max-width: 1200px; margin: 64px auto 0; padding: 0 clamp(16px,5vw,80px); }
        .stat { flex: 1; text-align: center; padding: 32px 16px; border-top: 1px solid rgba(255,255,255,0.07); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .stat+.stat { border-left: 1px solid rgba(255,255,255,0.07); }
        .stat-num { font-family: 'Syne',sans-serif; font-size: 40px; font-weight: 800; letter-spacing: -0.03em; }
        .stat-num span { color: #5b6ef5; }
        .stat-label { font-size: 13px; color: #6e6e8a; margin-top: 4px; }
        section { max-width: 1200px; margin: 0 auto; padding: 96px clamp(16px,5vw,80px); }
        .eyebrow { font-family: 'JetBrains Mono',monospace; font-size: 12px; color: #5b6ef5; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 16px; }
        h2 { font-family: 'Syne',sans-serif; font-size: clamp(28px,4vw,48px); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 16px; line-height: 1.1; }
        .section-sub { font-size: 17px; color: #6e6e8a; max-width: 520px; line-height: 1.7; margin-bottom: 64px; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 1px; background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; overflow: hidden; }
        .feature-card { background: #111118; padding: 32px; transition: background 0.2s; }
        .feature-card:hover { background: #1a1a24; }
        .feature-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(91,110,245,0.12); border: 1px solid #5b6ef5; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; font-size: 20px; }
        .feature-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .feature-card p { font-size: 14px; color: #6e6e8a; line-height: 1.65; }
        .stack-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 12px; }
        .stack-item { background: #111118; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px; text-align: center; transition: border-color 0.2s, transform 0.15s; }
        .stack-item:hover { border-color: #5b6ef5; transform: translateY(-2px); }
        .stack-emoji { font-size: 28px; margin-bottom: 10px; }
        .stack-name { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
        .stack-role { font-size: 12px; color: #6e6e8a; }
        .cta-section { padding: 96px clamp(16px,5vw,80px); text-align: center; position: relative; }
        .cta-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 500px; height: 300px; background: radial-gradient(ellipse, rgba(91,110,245,0.2) 0%, transparent 70%); pointer-events: none; }
        .cta-section p { color: #6e6e8a; margin-bottom: 40px; font-size: 18px; }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        footer { border-top: 1px solid rgba(255,255,255,0.07); padding: 40px clamp(16px,5vw,80px); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .footer-logo { font-family: 'JetBrains Mono',monospace; font-weight: 600; color: #6e6e8a; font-size: 14px; }
        .footer-logo span { color: #5b6ef5; }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 13px; color: #6e6e8a; }
        .footer-links a:hover { color: #e8e8f0; }
        .footer-credit { font-size: 13px; color: #3a3a52; }
        @media (max-width: 600px) {
          .nav-links a:not(.nav-cta) { display: none; }
          .stats { flex-wrap: wrap; }
          .stat { flex: 1 1 50%; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-logo">
          <span>{"//"}</span> CodeSync
        </div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#stack">Stack</a>
          <Link href="/" className="nav-cta">
            Open App →
          </Link>
        </div>
      </nav>

      <div className="hero">
        <div className="badge">
          <span className="dot"></span>Live · Real-time collaboration
        </div>
        <h1>
          Code together,
          <br />
          <em>in real time.</em>
        </h1>
        <p className="hero-sub">
          A collaborative code editor where every keystroke syncs instantly
          across all connected users. Built on WebSockets, Monaco Editor, and a
          production-grade TypeScript stack.
        </p>
        <div className="hero-actions">
          <Link href="/" className="btn-primary">
            Open App →
          </Link>
          <a
            href="https://github.com/hawetengg/Real-Time-Collaborative-Code-Editor"
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>
      </div>

      <div className="editor-preview">
        <div className="editor-window">
          <div className="editor-titlebar">
            <div className="dr" style={{ background: "#ff5f56" }}></div>
            <div className="dr" style={{ background: "#ffbd2e" }}></div>
            <div className="dr" style={{ background: "#27c93f" }}></div>
            <span className="editor-filename">
              collaborative-session · main.ts
            </span>
            <div className="editor-users">
              <div className="avatar" style={{ background: "#5b6ef5" }}>
                N
              </div>
              <div className="avatar" style={{ background: "#f472b6" }}>
                S
              </div>
              <div className="avatar" style={{ background: "#34d399" }}>
                M
              </div>
            </div>
          </div>
          <div className="editor-body">
            <div className="line-nums">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                <div key={n}>{n}</div>
              ))}
            </div>
            <div className="code-area">
              <span className="cm">
                {"// Real-time session · 3 users connected"}
              </span>
              {"\n"}
              <span className="kw">import</span>
              {" { "}
              <span className="fn">createSocket</span>
              {" } "}
              <span className="kw">from</span>{" "}
              <span className="str">{"'../lib/socket'"}</span>
              {"\n\n"}
              <span className="kw">const</span>
              {" socket = createSocket()\n\n"}
              {"socket."}
              <span className="fn">on</span>
              {"("}
              <span className="str">{"'room-state'"}</span>
              {", ({ code, users }) => {\n"}
              {"  editor."}
              <span className="fn">setValue</span>
              {"(code)\n"}
              {"  "}
              <span className="fn">renderPresence</span>
              {"(users)\n"}
              {"})\n\n"}
              {"socket."}
              <span className="fn">on</span>
              {"("}
              <span className="str">{"'code-updated'"}</span>
              {", (newCode) => {"}
              <span className="cursor"></span>
              {"\n"}
              {"  editor."}
              <span className="fn">setValue</span>
              {"(newCode)\n"}
              {"})"}
            </div>
          </div>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="stat-num">
            <span>&lt;</span>100ms
          </div>
          <div className="stat-label">sync latency</div>
        </div>
        <div className="stat">
          <div className="stat-num">
            5<span>+</span>
          </div>
          <div className="stat-label">languages</div>
        </div>
        <div className="stat">
          <div className="stat-num">∞</div>
          <div className="stat-label">users per room</div>
        </div>
        <div className="stat">
          <div className="stat-num">0</div>
          <div className="stat-label">polling requests</div>
        </div>
      </div>

      <section id="features">
        <div className="eyebrow">Features</div>
        <h2>
          Everything a team needs
          <br />
          to code together
        </h2>
        <p className="section-sub">
          From real-time sync to email invites, built production-ready from the
          ground up.
        </p>
        <div className="features-grid">
          {[
            [
              "⚡",
              "Instant sync",
              "Every keystroke broadcasts via WebSocket. No polling, no lag — changes appear across all clients in under 100ms.",
            ],
            [
              "👁️",
              "Live presence",
              "See who is in the room with avatar circles and live typing indicators.",
            ],
            [
              "📨",
              "Email invites",
              "Invite collaborators by email. Invites arrive as real-time notifications — no refresh needed.",
            ],
            [
              "🔐",
              "Secure auth",
              "JWT authentication with bcrypt password hashing. Sessions persist across refreshes.",
            ],
            [
              "🏠",
              "Room management",
              "Create, rename, delete rooms. Share a link to invite anyone.",
            ],
            [
              "🎨",
              "Monaco Editor",
              "Powered by the same engine as VS Code. Full syntax highlighting for JS, TS, Python, Go, and Rust.",
            ],
          ].map(([icon, title, desc]) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="stack"
        style={{ background: "#111118", borderRadius: "24px", marginBlock: 0 }}
      >
        <div className="eyebrow">Tech stack</div>
        <h2>
          Production-grade,
          <br />
          end to end
        </h2>
        <p className="section-sub">
          Every layer chosen for performance, developer experience, and
          scalability.
        </p>
        <div className="stack-grid">
          {[
            ["▲", "Next.js 15", "Frontend · App Router"],
            ["🔌", "Socket.io", "Real-time · WebSockets"],
            ["📝", "Monaco Editor", "VS Code engine"],
            ["🟢", "Node + Express", "Backend · REST API"],
            ["🐘", "PostgreSQL", "Database · via Neon"],
            ["🔺", "Prisma", "ORM · Type-safe queries"],
            ["🔑", "JWT + bcrypt", "Auth · Secure sessions"],
            ["🚀", "Vercel + Render", "Deploy · Full stack"],
          ].map(([emoji, name, role]) => (
            <div className="stack-item" key={name}>
              <div className="stack-emoji">{emoji}</div>
              <div className="stack-name">{name}</div>
              <div className="stack-role">{role}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="cta-section">
        <div className="cta-glow"></div>
        <h2>Start collaborating now</h2>
        <p>Open two tabs, invite a friend, start coding together.</p>
        <div className="cta-actions">
          <Link href="/" className="btn-primary">
            Open the app
          </Link>
          <a
            href="https://github.com/hawetengg/Real-Time-Collaborative-Code-Editor"
            className="btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            Star on GitHub
          </a>
        </div>
      </div>

      <footer>
        <div className="footer-logo">
          <span>{"//"}</span> CodeSync
        </div>
        <div className="footer-links">
          <Link href="/">Live App</Link>
          <a
            href="https://github.com/hawetengg/Real-Time-Collaborative-Code-Editor"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
        <div className="footer-credit">Built by Natanan · AUBG</div>
      </footer>
    </main>
  );
}
