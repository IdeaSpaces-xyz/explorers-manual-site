import matter from 'gray-matter';
import { READING_ORDER } from './pages.mjs';
import { COMMIT, SITE, detached, front, inGroup, updates, type Page, type Update } from './content';

const yamlValue = (text: string) => JSON.stringify(text);

const noteBlock = (page: Page) =>
  [
    '---',
    `url: ${SITE}${page.route === '/' ? '/' : page.route}`,
    `name: ${yamlValue(page.name)}`,
    `summary: ${yamlValue(page.summary)}`,
    '---',
    '',
    detached(matter(page.raw).content, page.path),
  ].join('\n');

const postBlock = (post: Update) =>
  [
    '---',
    `url: ${SITE}${post.route}`,
    `name: ${yamlValue(post.name)}`,
    `summary: ${yamlValue(post.summary)}`,
    `date: ${post.date.toISOString().slice(0, 10)}`,
    '---',
    '',
    detached(post.body, post.file),
  ].join('\n');

/** Every published page in one file: the manual's reading order, then the updates, newest first. */
export function llmsFull(): string {
  const notes = READING_ORDER.flatMap((group) => inGroup(group));
  const head = [
    `# ${front.name}: every page in one file`,
    '',
    `> ${front.summary}`,
    '',
    `Each page starts with its address, name and summary. Built from the manual at commit ${COMMIT}.`,
  ].join('\n');
  return `${[head, ...notes.map(noteBlock), ...updates.map(postBlock)].join('\n\n')}\n`;
}
