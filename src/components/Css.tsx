// Inline CSS that survives hydration.
//
// Passing CSS as a text child of <style> is NOT hydration-safe. Whenever the
// rule contains a child combinator, React's server renderer escapes it —
// `.row>div` is emitted as `.row&gt;div` — while the client expects the raw
// text. React reports "Text content does not match server-rendered HTML",
// abandons hydration and re-renders the entire root from scratch.
//
// That was not a cosmetic warning. The re-render replaced every DOM node on the
// page, and useReveal() had already attached its IntersectionObserver to the
// original nodes. The observer was left watching detached elements, so no
// element ever received the `in` class and the whole page stayed at
// `opacity: 0` — most visibly the club grid, which rendered as an empty
// bordered container.
//
// Setting the CSS as raw HTML makes both sides byte-identical, so hydration
// succeeds and the reveal observer keeps the nodes it observed.
export function Css({ children }: { children: string }) {
  return <style dangerouslySetInnerHTML={{ __html: children }} />;
}
