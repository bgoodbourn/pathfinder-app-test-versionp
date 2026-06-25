/* Bottom sheet: slides up over a fading scrim; tap scrim to dismiss. */
export function BottomSheet({ title, onClose, children }) {
  return (
    <div className="m-scrim" onClick={onClose}>
      <div className="m-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <span className="m-grab" />
        {title && <div className="m-sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
