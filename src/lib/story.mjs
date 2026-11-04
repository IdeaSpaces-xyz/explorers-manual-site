// How it works' scroll story. The Note holds the words and marks each beat; this
// file holds what each beat shows. The build refuses a Note whose beats differ.

/** @type {{ id: string, show: string[], flows?: string[], hot?: string, crumb?: string, pov?: 'root' | 'reviewer' }[]} */
export const BEATS = [
  { id: 'loop', show: ['boxWide', 'gCtx'], flows: ['f-ma'], hot: 'n-model' },
  { id: 'fluent', show: ['boxWide', 'gCompare'], flows: ['f-repo'] },
  { id: 'thousand-shapes', show: ['boxWide', 'gCompare'] },
  { id: 'pieces', show: ['boxTight', 'gSpace'] },
  { id: 'folder', show: ['boxTight', 'gSpace'], flows: ['f-in', 'f-out'], hot: 'n-model' },
  { id: 'is-the-agent', show: ['boxTight', 'gSpace'], crumb: '~/agents/reviewer/', pov: 'reviewer' },
  { id: 'travels', show: ['boxTight', 'gSpace', 'gFork'], crumb: '~/agents/reviewer/', pov: 'reviewer' },
  { id: 'any-harness', show: ['boxTight', 'gMesh'] },
];

export const POV = {
  root: ['foundation.md', 'guide.md', 'now.md'],
  reviewer: ['never approve without a test', 'say which line, not which file', 'push back on scope'],
};
