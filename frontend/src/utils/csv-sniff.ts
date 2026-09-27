// Client-side peek at the first lines of a CSV, only to suggest column names
// for the manual mapping when the server could not detect the columns.
// The real parsing always happens on the server.
export async function sniffHeaderCandidates(file: File, maxLines = 15): Promise<string[]> {
  const buffer = await file.slice(0, 64 * 1024).arrayBuffer();
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    text = new TextDecoder('windows-1252').decode(buffer);
  }

  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .slice(0, maxLines);
  const delimiter = [';', ',', '\t', '|'].reduce((best, candidate) =>
    lines.join('').split(candidate).length > lines.join('').split(best).length ? candidate : best,
  );

  // Header-looking cells: text without digits (dates and amounts have digits)
  const candidates = lines
    .flatMap((line) => line.split(delimiter))
    .map((cell) => cell.trim().replace(/^"|"$/g, ''))
    .filter((cell) => cell && cell.length <= 40 && !/\d/.test(cell));

  return [...new Set(candidates)];
}
