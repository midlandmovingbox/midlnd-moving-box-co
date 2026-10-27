// The approved logo artwork (public/logo-lockup.png). Never redraw or recolor it.
export default function SiteLogo({ height = 46, icon = false, style, className = 'site-logo' }) {
  return (
    <a href="/" aria-label="Midland Moving Box Co. home" style={{ display: 'inline-block', lineHeight: 0, ...style }}>
      <img
        className={className}
        src={icon ? '/logo-icon.png' : '/logo-lockup.png'}
        alt="Midland Moving Box Co."
        style={{ height, width: 'auto', display: 'block' }}
      />
    </a>
  );
}
