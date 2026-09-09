/* Image → data-URL helpers for the admin Inventory photo uploader. */

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = src;
  });
}

/**
 * Converts an image file to a base64 data URL, downsizing it first
 * (max 1000px edge, JPEG) so several products' photos still fit
 * within browser localStorage quotas.
 */
export async function toCompactDataUrl(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  if (file.size < 150_000) return dataUrl; // already small — keep as-is

  try {
    const img = await loadImage(dataUrl);
    const maxDim = 1000;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return dataUrl; // can't decode — fall back to the raw data URL
  }
}
