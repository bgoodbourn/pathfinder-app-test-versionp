/* ==================================================================== *
 *  LayoutRouter — picks the desktop binder or the mobile companion shell
 *
 *  Sits inside ScenarioProvider so both shells share live scenario data.
 *  The resolved layout is computed once at first paint (synchronous —
 *  localStorage + UA + URL, never IndexedDB) and flipped live by the
 *  in-app toggles, which persist the choice so it survives a reload.
 * ==================================================================== */
import { Suspense, lazy, useState, useCallback } from "react";
import { BinderApp } from "./App.jsx";
import { resolveLayout, setOverride } from "./lib/device.js";

// Mobile bundle (+ its CSS) is code-split so desktop users never download it.
const MobileApp = lazy(() => import("./components/mobile/MobileApp.jsx"));

export function LayoutRouter() {
  const [layout, setLayout] = useState(() => resolveLayout());

  const goDesktop = useCallback(() => { setOverride("desktop"); setLayout("desktop"); }, []);
  const goMobile = useCallback(() => { setOverride("mobile"); setLayout("mobile"); }, []);

  if (layout === "mobile") {
    return (
      <Suspense fallback={<MobileBoot />}>
        <MobileApp onRequestDesktop={goDesktop} />
      </Suspense>
    );
  }
  return <BinderApp onRequestMobile={goMobile} />;
}

// Lightweight loader shown while the mobile chunk loads (matches the screen bg).
function MobileBoot() {
  return (
    <div style={{ minHeight: "100vh", background: "#F4F4F2", display: "grid", placeItems: "center", color: "#9a9a95", fontSize: 13 }}>
      loading…
    </div>
  );
}
