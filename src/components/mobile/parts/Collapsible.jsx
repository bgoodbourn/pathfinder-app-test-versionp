/* Collapsible card: title + optional pill + chevron that rotates when open. */
import { useState } from "react";
import { IconChevDown } from "./MobileIcons.jsx";

export function Collapsible({ title, pill, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="m-card m-collapse">
      <button className="m-collapse-head" onClick={() => setOpen((v) => !v)}>
        <span className="m-collapse-title">{title}</span>
        {pill != null && <span className="m-pill m-pill-dark">{pill}</span>}
        <span className="m-collapse-chev" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <IconChevDown size={15} />
        </span>
      </button>
      {open && <div className="m-collapse-body">{children}</div>}
    </div>
  );
}
