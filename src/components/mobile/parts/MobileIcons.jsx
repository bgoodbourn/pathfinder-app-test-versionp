/* Inline stroke icons for the mobile shell (1.6 weight, ~23px).
 * Kept separate from the desktop icon set so mobile owns its own glyphs. */
const S = ({ children, size = 23, sw = 1.6, fill = "none" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconNotes = (p) => (
  <S {...p}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 12h7M9 16h7" /></S>
);
export const IconPeople = (p) => (
  <S {...p}><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 6a3 3 0 0 1 0 6" /><path d="M16.5 14.5a5.5 5.5 0 0 1 4 5.5" /></S>
);
export const IconShield = (p) => (
  <S {...p}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /></S>
);
export const IconSwords = (p) => (
  <S {...p}><path d="M14.5 3.5L20 3v.5L14.5 9M9.5 14.5L4 20v.5L4.5 20 10 14.5" /><path d="M3 4l9 9M21 4l-9 9M9 15l-2 2M15 15l2 2" /></S>
);
export const IconMonitor = (p) => (
  <S {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M9 20h6M12 16v4" /></S>
);
export const IconChevDown = (p) => (<S {...p} size={p.size || 16}><path d="M6 9l6 6 6-6" /></S>);
export const IconChevLeft = (p) => (<S {...p} size={p.size || 16}><path d="M15 6l-6 6 6 6" /></S>);
export const IconPlus = (p) => (<S {...p}><path d="M12 5v14M5 12h14" /></S>);
export const IconSearch = (p) => (<S {...p} size={p.size || 17}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.2-3.2" /></S>);
export const IconLink = (p) => (<S {...p} size={p.size || 14}><path d="M9 15l6-6" /><path d="M11 7l1-1a3.5 3.5 0 0 1 5 5l-1 1" /><path d="M13 17l-1 1a3.5 3.5 0 0 1-5-5l1-1" /></S>);
export const IconD20 = (p) => (<S {...p} size={p.size || 18}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 3v18M4 7.5l8 3 8-3M4 16.5l8-3 8 3" /></S>);
export const IconClose = (p) => (<S {...p} size={p.size || 16}><path d="M6 6l12 12M18 6L6 18" /></S>);
