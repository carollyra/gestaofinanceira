// Brazilian banks often export CSV in Windows-1252 instead of UTF-8.
// Strict UTF-8 decoding fails on those bytes, so we fall back to Windows-1252.
export function decodeCsvBuffer(buffer: Buffer): { content: string; encoding: string } {
  try {
    const content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return { content: content.replace(/^\uFEFF/, ''), encoding: 'utf-8' };
  } catch {
    return { content: new TextDecoder('windows-1252').decode(buffer), encoding: 'windows-1252' };
  }
}
