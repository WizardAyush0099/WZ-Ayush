import { useDeviceTier } from "../../lib/hooks";
import { useStudio } from "../../lib/siteData";
import EmberCanvas from "./EmberCanvas";

/**
 * Global atmospheric overlay: film grain, a soft vignette and a thin drift of
 * embers. Deliberately understated — no flocks, no bursts, nothing that draws
 * attention away from the content.
 *
 * Each layer answers to its own switch in `#/admin → Studio → Effects`, and a
 * layer that is switched off is never mounted at all — so turning the embers
 * off costs nothing to run, rather than being painted at zero opacity.
 */
export default function Atmosphere() {
  const tier = useDeviceTier();
  const { grain, vignette, embers } = useStudio().effects;
  const density = tier === "low" ? 0.4 : tier === "mid" ? 0.6 : 0.8;

  return (
    <>
      {grain ? <div className="fx-layer grain" aria-hidden="true" /> : null}
      {vignette ? <div className="fx-layer vignette" aria-hidden="true" /> : null}
      {embers ? <EmberCanvas density={density} /> : null}
    </>
  );
}
