// Dependencies are QA-only; see README.md in this directory.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt({html: true});
md.renderer.rules.heading_open = function (tokens, index) {
  const id = tokens[index + 1].content.toLowerCase().replace(/[^a-z0-9 -]/g, '').trim().replace(/ +/g, '-');
  return '<' + tokens[index].tag + ' id="' + id + '">';
};
const source = fs.readFileSync('_pages/publications.md', 'utf8').split('---').slice(2).join('---');
const html = '<body data-page="/publications/"><nav id="site-nav"><button aria-expanded="false"></button><ul id="navigation-overflow" class="hidden"></ul></nav><main class="archive">' + md.render(source) + '</main></body>';
// Homepage links remain in content even when the masthead is collapsed.
const homeSource = fs.readFileSync('_pages/about.md', 'utf8').split('---').slice(2).join('---');
const home = new JSDOM('<body class="academic-site"><nav id="site-nav" hidden></nav><main><section class="page__content">' + md.render(homeSource) + '</section></main></body>');
const homeDoc = home.window.document;
const styles = homeDoc.createElement('style');
styles.textContent = fs.readFileSync('assets/css/academic-refresh.css', 'utf8');
homeDoc.head.append(styles);
const shortcuts = homeDoc.querySelector('main .page__content .profile-shortcuts');
assert.ok(shortcuts && !shortcuts.closest('#site-nav'));
const expectedLinks = [
  ['Publications', '/publications/'], ['Research Lab', 'https://iel.unist.ac.kr'],
  ['Talks', '/talks/'], ['Teaching', '/teaching/'], ['CV', '/cv/']
];
assert.deepEqual([...shortcuts.querySelectorAll('a')].map(a => [a.textContent, a.getAttribute('href')]), expectedLinks);
assert.equal(home.window.getComputedStyle(shortcuts).display, 'flex');
assert.equal(home.window.getComputedStyle(shortcuts).flexWrap, 'wrap');
[shortcuts, ...shortcuts.querySelectorAll('a')].forEach(element => {
  for (let node = element; node; node = node.parentElement) {
    assert.equal(node.hidden, false);
    assert.notEqual(node.getAttribute('aria-hidden'), 'true');
    const computed = home.window.getComputedStyle(node);
    assert.notEqual(computed.display, 'none');
    assert.notEqual(computed.visibility, 'hidden');
  }
});
// Inspect every refresh breakpoint statically; this does not replace mobile browser QA.
function checkShortcutRules(rules) {
  [...rules].forEach(rule => {
    if (rule.cssRules) checkShortcutRules(rule.cssRules);
    if (rule.selectorText && rule.selectorText.includes('.profile-shortcuts')) {
      assert.notEqual(rule.style.getPropertyValue('display'), 'none');
      assert.notEqual(rule.style.getPropertyValue('visibility'), 'hidden');
      assert.notEqual(rule.style.getPropertyValue('overflow'), 'hidden');
      assert.notEqual(rule.style.getPropertyValue('white-space'), 'nowrap');
      assert.notEqual(rule.style.getPropertyValue('flex-wrap'), 'nowrap');
    }
  });
}
checkShortcutRules(styles.sheet.cssRules);
assert.equal(home.window.getComputedStyle(shortcuts.querySelector('a')).whiteSpace, 'normal');
console.log('PASS homepage: all five visible in-content destinations, independent of collapsed header; flex wrapping/no hiding rules across refresh breakpoints (static/DOM only)');
home.window.close();

(async () => {
  const dom = new JSDOM(html, {runScripts: 'outside-only', url: 'https://example.test/publications/'});
  const doc = dom.window.document;
  assert.equal(doc.querySelector('.publication-search').hidden, true);
  doc.querySelectorAll('.publication-years a').forEach(a => assert.ok(doc.getElementById(a.hash.slice(1)), a.hash));
  const before = doc.querySelector('.archive').textContent;
  dom.window.eval(fs.readFileSync('assets/js/academic-refresh.js', 'utf8'));
  const entries = [...doc.querySelectorAll('.publication-entry')];
  assert.equal(entries.length, 111, 'All original citation paragraphs retained and indexed');
  assert.equal(doc.querySelector('.publication-search').hidden, false);
  const approved = JSON.parse(fs.readFileSync('_tests/approved-publications.json', 'utf8'));
  approved.changes.forEach(change => {
    const doi = /\[DOI\]\((https:\/\/doi\.org\/[^)]+)\)/.exec(change.after)[1];
    assert.equal([...doc.querySelectorAll('.archive a')].filter(a => a.href === doi).length, 1, doi);
  });
  const input = doc.getElementById('publication-query');
  function search(query) { input.value = query; input.dispatchEvent(new dom.window.Event('input')); }
  search('blockchain');
  assert.ok(entries.some(e => e.hidden) && entries.some(e => !e.hidden));
  entries.filter(e => !e.hidden).forEach(e => assert.match(e.textContent.toLowerCase(), /blockchain/));
  search('UNMATCHABLE-QUERY-123456');
  assert.ok(entries.every(e => e.hidden));
  assert.match(doc.getElementById('publication-count').textContent, /^0 of/);
  search('<script>');
  assert.equal(doc.querySelectorAll('script').length, 0);
  const yearLink = doc.querySelector('.publication-years a');
  // Simulate the existing theme's smooth-scroll handler cancelling native navigation.
  yearLink.addEventListener('click', event => event.preventDefault());
  yearLink.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true, cancelable: true}));
  assert.equal(dom.window.location.hash, '#2026');
  assert.equal(input.value, '');
  assert.ok(entries.every(e => !e.hidden));
  const overflow = doc.getElementById('navigation-overflow');
  overflow.classList.remove('hidden');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(doc.querySelector('#site-nav button').getAttribute('aria-expanded'), 'true');
  doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', {key: 'Escape'}));
  assert.ok(overflow.classList.contains('hidden'));
  assert.equal(doc.querySelector('#site-nav button').getAttribute('aria-expanded'), 'false');
  assert.equal(before.replace(/\s+/g, ''), doc.querySelector('.archive').textContent.replace(doc.getElementById('publication-count').textContent, '').replace(/\s+/g, ''));
  console.log('PASS DOM: ' + entries.length + ' citations, year targets/hash retention, filtering/reset/no-results, safe query handling, preserved text, navigation state/Escape');
  dom.window.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
