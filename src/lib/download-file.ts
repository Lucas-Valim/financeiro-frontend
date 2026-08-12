/**
 * Triggers a browser download for an in-memory blob: wraps it in an object URL,
 * clicks a temporary anchor, then removes the anchor and revokes the URL so the
 * blob can be garbage collected. Extracted so the report export and the payment
 * preview share one implementation.
 */
export function downloadFile(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}
