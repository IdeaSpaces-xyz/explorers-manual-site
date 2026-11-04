// The scroll story, moved from the landing's React page without changing how it
// behaves. The stage only appears once this runs; the text never depends on it.
import { BEATS, POV } from '../lib/story.mjs';

const GROUPS = ['gCtx', 'gCompare', 'gSpace', 'gFork', 'gMesh', 'boxWide', 'boxTight'];
const FLOWS = ['f-ma', 'f-ar', 'f-rm', 'f-read', 'f-back', 'f-repo', 'f-in', 'f-out'];
const NODES = ['n-model', 'n-act', 'n-result'];

const root = document.querySelector<HTMLElement>('.hiw-story');
if (root) {
  const find = (id: string) => root.querySelector<SVGElement | HTMLElement>(`#${id}`);
  const crumb = find('crumb');
  const povElements = [find('pov1'), find('pov2'), find('pov3')];
  const actNumber = find('actNum');
  const actName = find('actName');
  const pips = Array.from(root.querySelectorAll<HTMLElement>('.hiw-progress i'));
  const beatElements = Array.from(root.querySelectorAll<HTMLElement>('.hiw-beat'));
  let current = -1;

  const render = (index: number) => {
    if (index === current) return;
    const beat = BEATS[index];
    const element = beatElements[index];
    if (!beat || !element) return;

    for (const id of GROUPS) find(id)?.setAttribute('opacity', beat.show.includes(id) ? '1' : '0');
    for (const id of FLOWS) {
      const flow = find(id);
      if (!flow) continue;
      const on = beat.flows?.includes(id) ?? false;
      flow.setAttribute('class', on ? 'flow on' : 'flow');
      flow.setAttribute('marker-end', on ? 'url(#ahOn)' : 'url(#ah)');
    }
    for (const id of NODES) find(id)?.setAttribute('class', beat.hot === id ? 'node hot' : 'node');

    if (crumb) crumb.textContent = beat.crumb ?? '~/space/';
    const pov = POV[beat.pov ?? 'root'];
    povElements.forEach((node, povIndex) => {
      if (node) node.textContent = pov[povIndex];
    });

    if (actNumber) actNumber.textContent = element.dataset.actNumber ?? '';
    if (actName) actName.textContent = element.dataset.actName ?? '';
    pips.forEach((pip, pipIndex) => {
      pip.className = pipIndex === index ? 'on' : pipIndex < index ? 'done' : '';
    });
    beatElements.forEach((node, beatIndex) => node.classList.toggle('live', beatIndex === index));
    current = index;
  };

  const markerY = () => (window.innerWidth <= 900 ? window.innerHeight * 0.7 : window.innerHeight * 0.5);
  const sync = () => {
    const line = markerY();
    let best = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    beatElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const distance = line < rect.top ? rect.top - line : line > rect.bottom ? line - rect.bottom : 0;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    render(best);
  };

  let frame: number | null = null;
  const queueSync = () => {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(() => {
      frame = null;
      sync();
    });
  };

  window.addEventListener('scroll', queueSync, { passive: true });
  window.addEventListener('resize', queueSync);
  render(0);
  sync();
}
