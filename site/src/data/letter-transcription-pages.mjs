// Only standalone editorial page marks establish a link to a published scan.
// Slicing at original offsets preserves every character, including the preamble.
export function letterTranscriptionPages(text, imageDescriptions, imageCount) {
  if (!text || imageCount < 2 || imageDescriptions?.length !== imageCount) return [];
  const marks = [...text.matchAll(/^[\t ]*【第([1-9]\d*)页】[\t ]*(?=\r?$)/gm)];
  if (marks.length !== imageCount || marks.some((mark, i) => Number(mark[1]) !== i + 1)) return [];
  const ordered = imageDescriptions.every((description, i) => {
    const label = String(description).trim();
    if (i === imageCount - 1 && /^末页(?:[；;，,。\s（(]|$)/.test(label)) return true;
    return Number(/^第([1-9]\d*)(?:信)?页(?:[；;，,。\s（(]|$)/.exec(label)?.[1]) === i + 1;
  });
  if (!ordered) return [];
  return marks.map((mark, i) => text.slice(i === 0 ? 0 : mark.index, marks[i + 1]?.index));
}
