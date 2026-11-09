export function previousScreen(history, current) {
  while (history.length) {
    const previous = history.pop();
    if (previous !== current && previous !== "reader") return previous;
  }
  return "home";
}
