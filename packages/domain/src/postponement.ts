import {
  POSTPONE_ARCHIVE_THRESHOLD,
  type Postponement,
  type PostponementReset,
} from './types';

export function consecutivePostponements(
  postponements: Postponement[],
  resets: PostponementReset[],
): number {
  const lastReset = resets
    .map((item) => item.createdAt)
    .sort()
    .at(-1);
  return postponements.filter(
    (item) => !lastReset || item.createdAt > lastReset,
  ).length;
}

export function shouldSuggestArchive(
  postponements: Postponement[],
  resets: PostponementReset[],
): boolean {
  return (
    consecutivePostponements(postponements, resets) >=
    POSTPONE_ARCHIVE_THRESHOLD
  );
}
