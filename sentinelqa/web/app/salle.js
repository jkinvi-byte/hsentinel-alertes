// La salle blanche : une scène peinte une fois, en SVG plat (charte LEVELS : « un lieu, pas une liste »).
// Au centre, la paillasse et le microscope de la Sentinelle. Sur la lame, un trait rouge par faille prouvée, gris pour une
// faille manquée ; les relevés sont gravés sur le chant de la paillasse. Ni rond coloré, ni quadrillage, ni 3D.
// Le mouvement est une entrée unique (la lumière s'allume, le microscope se pose, les traits s'inscrivent), puis rien ne
// bouge. Les clés des traits sont stables : pendant un audit, seul le trait d'une nouvelle preuve fait son entrée.

const ORIGINE = { x: 1000, y: 512 };
const ECHELLE = 1.85;
// Le premier trait de chaque thème sur la lame (repère du microscope : la lame va de -32 à 14)
const DEPART = { lecture: -27, ecriture: -12, admin: 3 };
const PAS = 2.4;
const PLAQUE = [850, 1000, 1150];

const CADRAGES = {
  // L'accueil : la salle entière sur grand écran, un plan serré sur le téléphone
  salle: [{ cle: 'large', boite: '0 0 1440 800', ratio: 'xMidYMid slice' }, { cle: 'serre', boite: '680 70 640 700', ratio: 'xMidYMid meet' }],
  // Le suivi : un plan serré, à côté du titre
  suivi: [{ cle: 'suivi', boite: '700 92 600 668', ratio: 'xMidYMid meet' }],
};

export default function Salle({ groupes, cadrage = 'salle' }) {
  return (
    <div className="salle-scene" data-cadrage={cadrage}>
      {CADRAGES[cadrage].map((c) => (
        <svg key={c.cle} className={`dessin dessin-${c.cle}`} viewBox={c.boite} preserveAspectRatio={c.ratio} role="img"
          aria-label={`La salle blanche : le microscope de la Sentinelle. ${groupes.map((g) => `${g.libelle} ${g.total ? `${g.prouvees} sur ${g.total}` : g.prouvees}`).join(', ')}.`}>
          <Dessin p={c.cle} groupes={groupes} />
        </svg>
      ))}
    </div>
  );
}

function Dessin({ p, groupes }) {
  const id = (nom) => `${p}-${nom}`;
  const url = (nom) => `url(#${p}-${nom})`;
  let rang = 0;
  const traits = groupes.flatMap((g) => {
    const nombre = Math.max(g.total, g.prouvees);
    return Array.from({ length: nombre }, (_, i) => {
      const prouvee = i < g.prouvees;
      const delai = 1.15 + rang++ * 0.08;
      return (
        <rect key={`${g.cle}-${i}-${prouvee ? 'p' : 'm'}`} className={`trait-faille${prouvee ? ' prouvee' : ''}`}
          x={DEPART[g.cle] + i * PAS} y="-91.8" width="1.3" height="3.8" rx="0.4" style={{ animationDelay: `${delai}s` }} />
      );
    });
  });

  return (
    <>
      <defs>
        <linearGradient id={id('mur')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef1f5" />
        </linearGradient>
        <linearGradient id={id('sol')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e6eaf0" />
          <stop offset="1" stopColor="#f6f7f9" />
        </linearGradient>
        <linearGradient id={id('gorge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dfe4eb" stopOpacity="0" />
          <stop offset="0.5" stopColor="#dce2ea" stopOpacity="0.32" />
          <stop offset="1" stopColor="#e6eaf0" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('profondeur')} cx="0.62" cy="0.3" r="0.95">
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#c9d0da" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id={id('faisceau')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id('ombre')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0e1116" stopOpacity="0.2" />
          <stop offset="1" stopColor="#0e1116" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('plateau')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef1f5" />
        </linearGradient>
        <linearGradient id={id('chant')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7ebf0" />
          <stop offset="1" stopColor="#d6dce4" />
        </linearGradient>
        <linearGradient id={id('pied')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#dfe4ea" />
          <stop offset="0.5" stopColor="#fafbfc" />
          <stop offset="1" stopColor="#d4dae2" />
        </linearGradient>
        <linearGradient id={id('metal')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d3d9e1" />
          <stop offset="0.45" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c8cfd8" />
        </linearGradient>
        <linearGradient id={id('metal-v')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d0d6df" />
        </linearGradient>
        <linearGradient id={id('bras')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#eef1f5" />
          <stop offset="1" stopColor="#cfd5de" />
        </linearGradient>
        <linearGradient id={id('lumiere')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dbe8ff" stopOpacity="0" />
          <stop offset="1" stopColor="#dbe8ff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* La salle : un mur d'un blanc froid, une gorge douce, un sol qui s'éclaircit vers l'avant */}
      <rect x="0" y="0" width="1440" height="600" fill={url('mur')} />
      <rect x="0" y="600" width="1440" height="200" fill={url('sol')} />
      <rect x="0" y="566" width="1440" height="68" fill={url('gorge')} />
      <rect x="0" y="0" width="1440" height="800" fill={url('profondeur')} />

      {/* La lumière qui tombe d'en haut, hors du cadre, sur la paillasse : elle s'allume une fois, à l'entrée */}
      <g className="lumiere">
        <path d="M872 0 L1128 0 L1262 512 L738 512 Z" fill={url('faisceau')} opacity="0.55" />
      </g>

      {/* La paillasse : ombre au sol, pieds, plateau vu légèrement de dessus, chant gravé */}
      <g className="paillasse">
        <ellipse cx="1000" cy="706" rx="300" ry="22" fill={url('ombre')} />
        <rect x="796" y="566" width="30" height="136" rx="6" fill={url('pied')} />
        <rect x="1174" y="566" width="30" height="136" rx="6" fill={url('pied')} />
        <path d="M772 492 L1228 492 L1268 528 L732 528 Z" fill={url('plateau')} />
        <path d="M772 492 L1228 492" stroke="#ffffff" strokeWidth="2" />
        <rect x="732" y="528" width="536" height="38" rx="4" fill={url('chant')} />
        <ellipse cx="1012" cy="514" rx="180" ry="8" fill={url('ombre')} />
      </g>

      {/* Le microscope, dans son repère (origine : le bas du socle), posé sur la paillasse */}
      <g className="microscope">
        <g transform={`translate(${ORIGINE.x} ${ORIGINE.y}) scale(${ECHELLE})`}>
          <path d="M-70 0 L70 0 Q75 0 72-6 L60-17 Q56-21 50-21 L-50-21 Q-56-21-60-17 L-72-6 Q-75 0-70 0 Z" fill={url('metal-v')} stroke="#cfd5de" vectorEffect="non-scaling-stroke" />
          <path d="M-56-19 L54-19" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <rect x="-16" y="-27" width="20" height="7" rx="3" fill={url('metal')} stroke="#cfd5de" vectorEffect="non-scaling-stroke" />
          <rect x="-12.5" y="-28.2" width="13" height="1.6" rx="0.8" fill="#ffffff" />
          <path d="M28-21 C32-58 36-86 40-108 C45-138 36-164 12-178 L0-165 C20-153 25-134 21-110 C17-88 12-58 8-21 Z" fill={url('bras')} stroke="#cdd3dc" vectorEffect="non-scaling-stroke" />
          <rect x="21" y="-101" width="13" height="18" rx="4" fill={url('metal')} stroke="#c9d0d9" vectorEffect="non-scaling-stroke" />
          <path d="M24-92 L31-92" stroke="#c4cbd5" strokeWidth="1.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <rect x="-44" y="-84" width="72" height="9" rx="2.5" fill={url('metal-v')} stroke="#cbd2db" vectorEffect="non-scaling-stroke" />
          <rect x="-13" y="-75" width="14" height="10" rx="2" fill={url('metal')} stroke="#cbd2db" vectorEffect="non-scaling-stroke" />
          <rect x="-32" y="-88" width="46" height="4" rx="1" fill="#f6fbff" stroke="#c3d0e3" vectorEffect="non-scaling-stroke" />
          <path d="M-12-104 L-4-104 L1-88 L-17-88 Z" fill={url('lumiere')} />
          <path d="M-24-124 L8-124 L4-114 L-20-114 Z" fill={url('metal-v')} stroke="#c8cfd8" vectorEffect="non-scaling-stroke" />
          <rect x="-13" y="-114" width="10" height="10" rx="2" fill="#2a303b" />
          <rect x="-13" y="-109" width="10" height="1.6" fill="#e2312b" />
          <rect x="1" y="-114" width="8" height="7" rx="2" fill="#3a414d" transform="rotate(18 5 -110)" />
          <rect x="-28" y="-148" width="44" height="26" rx="8" fill={url('metal-v')} stroke="#c8cfd8" vectorEffect="non-scaling-stroke" />
          <g transform="rotate(-28 -10 -150)">
            <rect x="-20" y="-200" width="20" height="54" rx="6" fill={url('metal')} stroke="#c8cfd8" vectorEffect="non-scaling-stroke" />
            <rect x="-22" y="-212" width="24" height="14" rx="4" fill="#2a303b" />
            <rect x="-18" y="-214" width="16" height="3" rx="1.5" fill="#4a5260" />
          </g>
          <g className="traits">{traits}</g>
        </g>
      </g>

      {/* Les relevés, gravés sur le chant de la paillasse : un clic mène au thème */}
      <g className="plaque">
        {groupes.map((g, i) => (
          <a key={g.cle} href={`/examen?theme=${g.cle}`} className="gravure">
            <text x={PLAQUE[i]} y="553" textAnchor="middle" className="grave-clair">{g.libelle.toUpperCase()} {g.total ? `${g.prouvees}/${g.total}` : g.prouvees}</text>
            <text x={PLAQUE[i]} y="552" textAnchor="middle" className="grave">{g.libelle.toUpperCase()} {g.total ? `${g.prouvees}/${g.total}` : g.prouvees}</text>
          </a>
        ))}
      </g>
    </>
  );
}
