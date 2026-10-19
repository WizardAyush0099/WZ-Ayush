import { useMemo } from "react";
import { studioCss, type StudioDoc } from "../../lib/studio";

/**
 * ============================================================================
 *  STUDIO LAYER — the document, painted onto the real page
 * ============================================================================
 *  Every point the owner has adjusted becomes one CSS rule against
 *  `[data-tune="<id>"]`, and this component is the only place that rule set
 *  reaches the document. That is deliberate: the site's own components stay
 *  exactly as they are, the values arrive as style rather than as props, and
 *  switching the layer off (an empty document) leaves the committed design
 *  untouched.
 *
 *  The rules only ever describe what the owner changed — a point left at its
 *  defaults produces no CSS at all — so the stylesheet stays tiny and the
 *  page's own layout wins wherever it was not overridden.
 * ============================================================================
 */
export default function StudioLayer({ doc }: { doc: StudioDoc }) {
  const css = useMemo(() => studioCss(doc), [doc]);
  if (!css) return null;
  return <style data-studio-layer dangerouslySetInnerHTML={{ __html: css }} />;
}
