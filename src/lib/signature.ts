// Renders a typed name as a cursive signature onto an offscreen canvas and
// exports it as a PNG data URL -- used for both the sender's signature
// (invoice creation) and the client's "type" signature mode (public pay
// page), so the two representations stay visually consistent.
export function generateTypedSignatureDataUrl(name: string): string | null {
  if (typeof document === "undefined" || !name.trim()) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 150;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = "48px 'Brush Script MT', 'Segoe Script', cursive";
  ctx.textBaseline = "middle";
  ctx.fillText(name.trim(), 30, 75);
  return canvas.toDataURL("image/png");
}
