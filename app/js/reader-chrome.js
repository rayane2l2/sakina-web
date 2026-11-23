// The reading bars (title, tabs, status, player) step aside while the reader scrolls or
// swipes the page, and come back with a single tap on the text. Only the page stays.

const SWIPE = 12;

// A finger that travelled further than a small jitter is a scroll or a swipe, not a tap.
export function isSwipe(start, point, threshold = SWIPE) {
  if (!start || !point) return false;
  return Math.hypot(point.x - start.x, point.y - start.y) > threshold;
}

let hidden = false;
let sizes = null;

// The page keeps room under the floating bars so its first and last lines can be read.
function measure(host) {
  // Offsets ignore the slide-away transform, so this also works while the bars are hidden.
  const top = host.querySelector(".reader-hud-top"),
    bottom = host.querySelector(".reader-hud-bottom");
  host.style.setProperty("--hud-top", (top ? top.offsetTop + top.offsetHeight : 0) + "px");
  host.style.setProperty("--hud-bottom", (bottom ? host.clientHeight - bottom.offsetTop : 0) + "px");
}

function shell(root) {
  return root.querySelector(".shell.reading");
}

function apply(root) {
  shell(root)?.classList.toggle("chrome-hidden", hidden);
}

export function showReaderChrome(root) {
  if (!hidden) return;
  hidden = false;
  apply(root);
}

function hideReaderChrome(root) {
  if (hidden) return;
  hidden = true;
  apply(root);
}

// Called after each render of the reader. `enabled` is false where the bars must stay
// (guided learning, an error to read). Leaving the reader brings the bars back next time.
export function bindReaderChrome(root, { enabled }) {
  const host = shell(root),
    stage = root.querySelector("#reader-stage");
  if (!enabled || !host || !stage) {
    sizes?.disconnect();
    hidden = false;
    host?.classList.remove("chrome-hidden");
    return;
  }
  host.classList.add("immersive");
  apply(root);
  sizes?.disconnect();
  measure(host);
  sizes = new ResizeObserver(() => measure(host));
  [host, ...host.querySelectorAll(".reader-hud")].forEach((el) => sizes.observe(el));
  let start = null;
  stage.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    start = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null;
  }, { passive: true });
  stage.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    if (isSwipe(start, { x: t.clientX, y: t.clientY })) hideReaderChrome(root);
  }, { passive: true });
  stage.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaY) + Math.abs(e.deltaX) > 4) hideReaderChrome(root);
  }, { passive: true });
  stage.addEventListener("click", () => showReaderChrome(root));
  // Reaching a hidden control with the keyboard shows the bars again.
  host.addEventListener("focusin", (e) => {
    if (!stage.contains(e.target)) showReaderChrome(root);
  });
}

export function resetReaderChrome() {
  sizes?.disconnect();
  hidden = false;
}
