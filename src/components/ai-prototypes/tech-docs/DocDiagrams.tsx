export function FlowDiagram() {
  return (
    <svg viewBox="0 0 820 420" className="w-full max-w-4xl mx-auto" aria-label="User flow diagram">
      <defs>
        <marker id="doc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3525cd" />
        </marker>
      </defs>
      <rect x="300" y="20" width="220" height="44" rx="10" fill="#eef0ff" stroke="#3525cd" strokeWidth="2" />
      <text x="410" y="48" textAnchor="middle" className="fill-on-surface text-[13px] font-bold">
        AI Prototypes Hub
      </text>
      <rect x="260" y="100" width="300" height="44" rx="8" fill="#fff" stroke="#3525cd" strokeWidth="2" />
      <text x="410" y="128" textAnchor="middle" className="fill-on-surface text-[13px] font-bold">
        Profile Optimization Hub
      </text>
      <line x1="410" y1="64" x2="410" y2="100" stroke="#3525cd" strokeWidth="2" markerEnd="url(#doc-arrow)" />
      <rect x="120" y="180" width="160" height="40" rx="8" fill="#fff" stroke="#3525cd" strokeWidth="2" />
      <text x="200" y="205" textAnchor="middle" className="fill-on-surface text-[13px] font-bold">
        Resume Tab
      </text>
      <rect x="540" y="180" width="160" height="40" rx="8" fill="#fff" stroke="#3525cd" strokeWidth="2" />
      <text x="620" y="205" textAnchor="middle" className="fill-on-surface text-[13px] font-bold">
        LinkedIn Tab
      </text>
      <line x1="340" y1="144" x2="200" y2="180" stroke="#3525cd" strokeWidth="2" markerEnd="url(#doc-arrow)" />
      <line x1="480" y1="144" x2="620" y2="180" stroke="#3525cd" strokeWidth="2" markerEnd="url(#doc-arrow)" />
      {[
        { x: 60, steps: ["Paste Resume + JD", "Tailoring progress", "Match Report + Print"] },
        { x: 480, steps: ["Profile URL + overrides", "Target JD(s)", "Alignment Report + Print"] },
      ].map(({ x, steps }) => (
        <g key={x}>
          {steps.map((label, i) => (
            <g key={label}>
              <rect
                x={x}
                y={250 + i * 50}
                width={280}
                height={36}
                rx={6}
                fill={i === 2 ? "#eef0ff" : "#f4f4f8"}
                stroke={i === 2 ? "#3525cd" : "#ccc"}
              />
              <text
                x={x + 140}
                y={272 + i * 50}
                textAnchor="middle"
                className={`text-[11px] ${i === 2 ? "fill-on-surface font-bold" : "fill-on-surface-variant"}`}
              >
                {label}
              </text>
              {i < 2 && (
                <line
                  x1={x + 140}
                  y1={220 + i * 50}
                  x2={x + 140}
                  y2={250 + i * 50}
                  stroke="#999"
                  strokeWidth="1.5"
                  markerEnd="url(#doc-arrow)"
                />
              )}
            </g>
          ))}
          <line
            x1={x + 140}
            y1={220}
            x2={x + 140}
            y2={250}
            stroke="#999"
            strokeWidth="1.5"
            markerEnd="url(#doc-arrow)"
          />
        </g>
      ))}
    </svg>
  );
}

export function SystemDiagram() {
  return (
    <svg viewBox="0 0 820 480" className="w-full max-w-4xl mx-auto" aria-label="System architecture diagram">
      <defs>
        <marker id="sys-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3525cd" />
        </marker>
      </defs>
      <rect x="30" y="200" width="100" height="50" rx="8" fill="#fff3cd" stroke="#d97706" strokeWidth="2" />
      <text x="80" y="230" textAnchor="middle" className="fill-on-surface text-[12px] font-bold">
        Job Seeker
      </text>
      <rect x="180" y="60" width="200" height="380" rx="10" fill="#eef0ff" stroke="#3525cd" strokeWidth="2" />
      <text x="280" y="88" textAnchor="middle" className="fill-on-surface text-[12px] font-extrabold">
        Next.js Frontend
      </text>
      {[
        { y: 110, label: "Profile Opt. Hub" },
        { y: 160, label: "Resume Optimizer" },
        { y: 210, label: "LinkedIn Optimizer" },
        { y: 260, label: "Admin CMS" },
      ].map(({ y, label }) => (
        <g key={label}>
          <rect x="200" y={y} width="160" height="36" rx="6" fill="#fff" stroke="#3525cd" />
          <text x="280" y={y + 23} textAnchor="middle" className="fill-on-surface text-[11px] font-semibold">
            {label}
          </text>
        </g>
      ))}
      <rect x="440" y="60" width="360" height="380" rx="10" fill="#f0fdf4" stroke="#059669" strokeWidth="2" />
      <text x="620" y="88" textAnchor="middle" className="fill-on-surface text-[12px] font-extrabold">
        Firebase / GCP
      </text>
      {[
        { x: 460, y: 110, w: 140, label: "Firebase Hosting" },
        { x: 620, y: 110, w: 160, label: "Firestore CMS" },
        { x: 460, y: 160, w: 160, label: "resumeOptimizerAnalyze" },
        { x: 630, y: 160, w: 150, label: "roleAlignAnalyze" },
        { x: 460, y: 210, w: 160, label: "roleAlignFetchProfile" },
        { x: 630, y: 210, w: 150, label: "recordToolUsage" },
      ].map(({ x, y, w, label }) => (
        <g key={label}>
          <rect x={x} y={y} width={w} height={32} rx="6" fill="#fff" stroke="#059669" />
          <text x={x + w / 2} y={y + 20} textAnchor="middle" className="fill-on-surface text-[10px] font-semibold">
            {label}
          </text>
        </g>
      ))}
      <rect x="500" y="280" width="120" height="40" rx="8" fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
      <text x="560" y="305" textAnchor="middle" className="fill-on-surface text-[11px] font-bold">
        Gemini API
      </text>
      <rect x="640" y="280" width="120" height="40" rx="8" fill="#fce7f3" stroke="#be185d" strokeWidth="2" />
      <text x="700" y="305" textAnchor="middle" className="fill-on-surface text-[11px] font-bold">
        Proxycurl
      </text>
      <line x1="130" y1="225" x2="180" y2="200" stroke="#3525cd" strokeWidth="2" markerEnd="url(#sys-arrow)" />
      <line x1="380" y1="178" x2="460" y2="176" stroke="#3525cd" strokeWidth="1.5" markerEnd="url(#sys-arrow)" />
      <line x1="380" y1="228" x2="460" y2="226" stroke="#3525cd" strokeWidth="1.5" markerEnd="url(#sys-arrow)" />
      <line x1="620" y1="300" x2="560" y2="280" stroke="#be185d" strokeWidth="1.5" markerEnd="url(#sys-arrow)" />
    </svg>
  );
}

export function PipelineDiagram() {
  const steps = [
    { x: 10, label: "Validate", sub: "" },
    { x: 115, label: "Normalize", sub: "keywords" },
    { x: 230, label: "Extract", sub: "Gemini 1" },
    { x: 335, label: "Analyze", sub: "Gemini 2" },
    { x: 440, label: "Score", sub: "45/35/20" },
    { x: 555, label: "Report", sub: "" },
    { x: 660, label: "SSE → UI", sub: "" },
  ];
  return (
    <svg viewBox="0 0 820 160" className="w-full max-w-4xl mx-auto" aria-label="Analyze pipeline">
      <defs>
        <marker id="pipe-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3525cd" />
        </marker>
      </defs>
      {steps.map((s, i) => (
        <g key={s.label}>
          <rect
            x={s.x}
            y={60}
            width={i === 2 || i === 3 ? 90 : i === 4 ? 100 : 90}
            height={44}
            rx={6}
            fill={i === 2 || i === 3 ? "#eef0ff" : "#fff"}
            stroke="#3525cd"
            strokeWidth="2"
          />
          <text x={s.x + 45} y={82} textAnchor="middle" className="fill-on-surface text-[11px] font-bold">
            {s.label}
          </text>
          {s.sub && (
            <text x={s.x + 45} y={96} textAnchor="middle" className="fill-on-surface-variant text-[9px]">
              {s.sub}
            </text>
          )}
          {i < steps.length - 1 && (
            <line
              x1={s.x + 90}
              y1={82}
              x2={steps[i + 1].x}
              y2={82}
              stroke="#3525cd"
              strokeWidth="2"
              markerEnd="url(#pipe-arrow)"
            />
          )}
        </g>
      ))}
    </svg>
  );
}

export function ReportLayoutDiagram() {
  return (
    <svg viewBox="0 0 820 300" className="w-full max-w-4xl mx-auto" aria-label="Report layout mockup">
      <rect x="20" y="20" width="140" height="260" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <text x="90" y="48" textAnchor="middle" className="fill-on-surface text-[12px] font-bold">
        Report Nav
      </text>
      {["Summary", "Keywords", "Experience", "AI & ATS", "Action plan"].map((item, i) => (
        <rect
          key={item}
          x={35}
          y={65 + i * 35}
          width={110}
          height={28}
          rx={4}
          fill={i === 0 ? "#eef0ff" : "#f4f4f8"}
          stroke={i === 0 ? "#3525cd" : "transparent"}
        />
      ))}
      <text x="90" y="248" textAnchor="middle" className="fill-on-primary text-[11px] font-bold">
        Print
      </text>
      <rect x="35" y="232" width={110} height={32} rx={4} fill="#3525cd" />
      <rect x="180" y="20" width="620" height="100" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <circle cx="250" cy="70" r="36" fill="none" stroke="#3525cd" strokeWidth="6" />
      <text x="250" y="76" textAnchor="middle" className="fill-on-surface text-[18px] font-extrabold">
        72%
      </text>
      <text x="320" y="55" className="fill-on-surface text-[13px] font-bold">
        Match Summary
      </text>
      <text x="320" y="78" className="fill-on-surface-variant text-[11px]">
        Acme Corp · Senior PM
      </text>
      <rect x="180" y="135" width="620" height="70" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <text x="200" y="158" className="fill-on-surface text-[13px] font-bold">
        Keyword Match
      </text>
      <line x1="200" y1="168" x2="780" y2="168" stroke="#e5e7eb" />
      <text x="220" y="188" className="fill-on-surface-variant text-[11px] font-bold">
        Skill · Your profile · JD
      </text>
      <rect x="180" y="220" width="620" height="60" rx="8" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
      <rect x="200" y="235" width="60" height="20" rx="3" fill="#eef0ff" />
      <text x="230" y="249" textAnchor="middle" className="fill-primary text-[10px] font-bold">
        REWRITE
      </text>
      <text x="280" y="248" className="fill-on-surface text-[12px] font-bold">
        Add quantified outcomes to bullets
      </text>
    </svg>
  );
}
