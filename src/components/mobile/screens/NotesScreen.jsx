/* Notes screen — the active scene "page" with read-aloud + GM references,
 * rendered read-only from overlay.gmPages. Live notes append via the FAB. */
import { NoteBlock } from "../blocks/NoteBlocks.jsx";
import { IconChevDown, IconMonitor, IconPlus } from "../parts/MobileIcons.jsx";

export function NotesScreen({
  campaignName, page, pageIndex, pageCount,
  onOpenJumper, onOpenScenarioPicker, onRequestDesktop, onOpenComposer,
  onOpenNpc, onOpenEncounter, onGoPage,
}) {
  const blocks = page?.blocks || [];
  return (
    <div className="m-screen m-notes">
      <header className="m-header">
        <div className="m-header-top">
          <button className="m-scen-switch" onClick={onOpenScenarioPicker}>
            {(campaignName || "scenario").toLowerCase()} · running order
            <IconChevDown size={13} />
          </button>
          <div className="m-header-actions">
            <button className="m-ghost-btn" onClick={onRequestDesktop} title="desktop view"><IconMonitor size={15} /></button>
            <span className="m-pill m-pill-run">run</span>
          </div>
        </div>

        {page ? (
          <>
            <button className="m-title-row" onClick={onOpenJumper}>
              <h1 className="m-title">{(page.title || "untitled").toLowerCase()}</h1>
              <IconChevDown size={18} />
              <span className="m-page-count">{pageIndex + 1} / {pageCount}</span>
            </button>
            <div className="m-progress">
              {Array.from({ length: pageCount }).map((_, i) => (
                <span key={i} className="m-progress-seg" style={{ background: i === pageIndex ? "#0e0e0e" : "#cfcec8" }} />
              ))}
            </div>
          </>
        ) : (
          <h1 className="m-title">notes</h1>
        )}
      </header>

      <div className="m-body">
        {page ? (
          blocks.length ? (
            blocks.map((b) => (
              <NoteBlock key={b.id} block={b} onOpenNpc={onOpenNpc} onOpenEncounter={onOpenEncounter} onGoPage={onGoPage} />
            ))
          ) : (
            <div className="m-empty">this page has no notes yet.</div>
          )
        ) : (
          <div className="m-empty">
            no running order for this scenario yet — build pages in the desktop binder, or add a live note below.
          </div>
        )}
      </div>

      <button className="m-fab" onClick={onOpenComposer} aria-label="add live note"><IconPlus size={22} /></button>
    </div>
  );
}
