export const MODELS = Object.freeze([{ id: "v3.1", label: "Quran Lab 3.1" }]);
// Migrate old preferences and imported backups to the single supported model.
export const normalizeModel = () => "v3.1";
export const modelLabel = () => MODELS[0].label;
export function modelPicker() {
  return '<p class="small muted">Reconnaissance vocale · Quran Lab 3.1</p>';
}
