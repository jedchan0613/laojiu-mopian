/** Only one-based, bounded image links may select a gallery attachment. */
export const galleryImageIndexFromHash = (hash, length) => {
  const match = /^#image-([1-9]\d{0,5})$/.exec(hash);
  if (!match || !Number.isSafeInteger(length) || length < 1) return undefined;
  const index = Number(match[1]) - 1;
  return index >= 0 && index < length ? index : undefined;
};
