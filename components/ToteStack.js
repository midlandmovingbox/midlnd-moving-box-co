// Stand-in "product is the hero" visual until real photos arrive: a stack of black totes
// with yellow lids. Replace with a real photo when we have one.
function Tote({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="104" height="14" rx="3" fill="#FFC72C" />
      <path d="M4 14 H100 L94 62 Q93 68 87 68 H17 Q11 68 10 62 Z" fill="#141413" />
      <rect x="34" y="26" width="36" height="8" rx="4" fill="#2a2a27" />
    </g>
  );
}

export default function ToteStack() {
  const xs = [0, 116, 232];
  const ys = [0, 78, 156];
  return (
    <svg viewBox="0 0 336 226" role="img" aria-label="Stacked black moving totes with yellow lids" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {ys.map((y) => xs.map((x) => <Tote key={`${x}-${y}`} x={x} y={y} />))}
    </svg>
  );
}
