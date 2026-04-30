// ABCLive UI Kit — Shared Components
// Exported to window.* for use in other Babel scripts

const { useState, useEffect, useRef } = React;

// ─── Utilities ────────────────────────────────────────────────────────────────

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

const BADGE_STYLES = {
  default:     { background: 'oklch(0.68 0.26 292 / 15%)', color: 'oklch(0.68 0.26 292)' },
  secondary:   { background: 'oklch(0.27 0.016 282)', color: 'oklch(0.97 0.005 282)' },
  success:     { background: 'oklch(0.75 0.18 158 / 15%)', color: 'oklch(0.75 0.18 158)' },
  destructive: { background: 'oklch(0.65 0.22 20 / 15%)', color: 'oklch(0.65 0.22 20)' },
  gold:        { background: 'oklch(0.82 0.17 82 / 15%)', color: 'oklch(0.82 0.17 82)' },
  cold:        { background: 'oklch(0.85 0.15 220 / 15%)', color: 'oklch(0.85 0.15 220)' },
  role:        { background: 'oklch(0.78 0.14 250 / 15%)', color: 'oklch(0.78 0.14 250)' },
  live:        { background: 'oklch(0.68 0.22 14 / 12%)', color: 'oklch(0.68 0.22 14)', border: '1px solid oklch(0.68 0.22 14 / 20%)' },
  outline:     { background: 'transparent', color: 'oklch(0.97 0.005 282)', border: '1px solid oklch(1 0 0 / 12%)' },
};

function Badge({ variant = 'default', children, style }) {
  const s = BADGE_STYLES[variant] || BADGE_STYLES.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 4, height: 20, padding: '0 10px', borderRadius: 9999,
      fontSize: '0.6875rem', fontWeight: 500, letterSpacing: '0.05em',
      textTransform: 'uppercase', whiteSpace: 'nowrap', border: '1px solid transparent',
      ...s, ...style
    }}>
      {children}
    </span>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────

function LiveDot() {
  return <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: 'oklch(0.68 0.22 14)',
    animation: 'live-pulse 1.5s ease-in-out infinite',
    marginRight: 2,
  }} />;
}

// ─── Button ────────────────────────────────────────────────────────────────────

function Button({ variant = 'default', size = 'default', children, onClick, style, disabled }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, border: '1px solid transparent', cursor: 'pointer',
    fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: '0.875rem',
    transition: 'all 0.15s', whiteSpace: 'nowrap', outline: 'none',
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = {
    default: { height: 32, padding: '0 12px', borderRadius: '0.625rem' },
    sm:      { height: 28, padding: '0 10px', borderRadius: '0.5rem', fontSize: '0.8125rem' },
    lg:      { height: 36, padding: '0 16px', borderRadius: '0.625rem' },
    xl:      { height: 44, padding: '0 24px', borderRadius: '0.75rem', fontSize: '1rem' },
    icon:    { height: 32, width: 32, borderRadius: '0.625rem', padding: 0 },
  };
  const variants = {
    default:     { background: 'linear-gradient(135deg, oklch(0.68 0.26 292), oklch(0.58 0.20 292))', color: 'oklch(0.08 0 0)' },
    secondary:   { background: 'oklch(0.16 0.016 282 / 70%)', borderColor: 'oklch(1 0 0 / 12%)', color: 'oklch(0.97 0.005 282)', borderRadius: '1rem' },
    outline:     { background: 'oklch(0.21 0.016 282)', borderColor: 'oklch(1 0 0 / 12%)', color: 'oklch(0.97 0.005 282)' },
    ghost:       { background: 'transparent', color: 'oklch(0.97 0.005 282)' },
    live:        { background: 'oklch(0.68 0.22 14 / 12%)', borderColor: 'oklch(0.68 0.22 14 / 25%)', color: 'oklch(0.68 0.22 14)' },
    destructive: { background: 'oklch(0.65 0.22 20 / 10%)', borderColor: 'oklch(0.65 0.22 20 / 20%)', color: 'oklch(0.65 0.22 20)' },
    tertiary:    { background: 'transparent', color: 'oklch(0.82 0.17 82)' },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────

function Input({ placeholder, value, onChange, type = 'text', style }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{
        height: 36, width: '100%', borderRadius: '1rem',
        border: '1px solid oklch(1 0 0 / 12%)',
        background: 'oklch(0.21 0.016 282)', color: 'oklch(0.97 0.005 282)',
        padding: '0 12px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)',
        outline: 'none', ...style
      }}
    />
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────

function Card({ children, style, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'oklch(0.21 0.016 282)' : 'oklch(0.16 0.016 282)',
        borderRadius: '1.5rem', overflow: 'hidden',
        transition: 'all 0.15s',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 8px 24px oklch(0 0 0 / 0.3)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
    >
      {children}
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size = 28 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, oklch(0.68 0.26 292), oklch(0.58 0.20 292))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'oklch(0.08 0 0)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ─── Icons (inline SVG) ────────────────────────────────────────────────────────

const Icon = ({ name, size = 14, color = 'currentColor', style }) => {
  const paths = {
    calendar:   <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    mapPin:     <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    building:   <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10M9 7h1M14 7h1M9 12h1M14 12h1"/></>,
    plus:       <><path d="M12 5v14M5 12h14"/></>,
    search:     <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    bell:       <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    chevronDown:<path d="m6 9 6 6 6-6"/>,
    logout:     <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    moon:       <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>,
    sun:        <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>,
    grid:       <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    list:       <><path d="M3 12h18M3 6h18M3 18h18"/></>,
    upload:     <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    check:      <polyline points="20 6 9 17 4 12"/>,
    x:          <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    cloudCheck: <><path d="M4.2 19.1A7 7 0 0 1 5 5.1c.29 0 .57.02.85.06A6 6 0 0 1 17.8 9.1h.2a4.5 4.5 0 0 1 .5 9"/><path d="m9 15 2 2 4-4"/></>,
    filter:     <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    user:       <><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></>,
    users:      <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    wrench:     <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
    clock:      <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    ticket:     <><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></>,
    arrowLeft:  <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
    paperclip:  <><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></>,
    messageSquare: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
};

// Export all to window
Object.assign(window, {
  Badge, LiveDot, Button, Input, Card, Avatar, Icon, cn,
  BADGE_STYLES,
});
