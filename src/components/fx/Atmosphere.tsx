import { useDeviceTier } from "../../lib/hooks";
import EmberCanvas from "./EmberCanvas";

/**
 * Global atmospheric overlay: film grain, a soft vignette and a thin drift of
 * embers. Deliberately understated — no flocks, no bursts, nothing that draws
 * attention away from the content.
 */
export default function Atmosphere() {
  const tier = useDeviceTier();
  const density = tier === "low" ? 0.4 : tier === "mid" ? 0.6 : 0.8;

  return (
    <>
      <div className="fx-layer grain" aria-hidden="true" />
      <div className="fx-layer vignette" aria-hidden="true" />
      <EmberCanvas density={density} />
    </>
  );
}
