import { useDeviceTier } from "../../lib/hooks";
import CrowCanvas from "./CrowCanvas";
import EmberCanvas from "./EmberCanvas";

/** Global atmospheric overlay: grain, vignette, embers and crows. */
export default function Atmosphere() {
  const tier = useDeviceTier();
  const density = tier === "low" ? 0.55 : tier === "mid" ? 0.8 : 1;

  return (
    <>
      <div className="fx-layer grain" aria-hidden="true" />
      <div className="fx-layer vignette" aria-hidden="true" />
      <EmberCanvas density={density} />
      <CrowCanvas />
    </>
  );
}
