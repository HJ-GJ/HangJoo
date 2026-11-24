/** Display-only editorial labels. Preserve YAML titles, original article content and permalinks. */
export function displayPostTitle(title: string): string {
  return title.replace(/^파이썬 기초 공부:\s*/, '[Python] ');
}
/** NO. 01-1 -> No.01_01; standalone NO. 01 -> No.01. */
export function displayIssue(issue: string): string {
  const normalized = issue.replace(/^NO\.\s*/i, '').trim();
  const pieces = normalized.split('-');
  return 'No.' + pieces.map(x=>x.padStart(2, '0')).join('_');
}
