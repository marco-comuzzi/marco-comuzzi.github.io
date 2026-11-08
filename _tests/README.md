# Academic refresh checks

From the repository root:

```sh
python3 _tests/check_preservation.py master
node --check assets/js/academic-refresh.js
git diff --check
npm install --prefix /tmp/academic-refresh-qa markdown-it jsdom
NODE_PATH=/tmp/academic-refresh-qa/node_modules node _tests/refresh.test.cjs
bundle install
bundle exec jekyll build
```

The Python check compares original wording, resource links and page metadata against the baseline (pass a different ref as the first argument if needed). The DOM tests cover progressive search and navigation without a browser. Markdown-it is only a test renderer, not a replacement for the production Kramdown/Jekyll build. The globally shared sidebar bio has one explicitly approved shortening; the check permits only that exact substitution in `_config.yml`. Existing deployment and framework remain unchanged. JavaScript-disabled visitors retain every publication and the year links. A browser review at desktop/mobile widths and a native Jekyll build are separate acceptance checks.

## Approved publication metadata follow-up

`approved-publications.json` records 42 reviewed exact before/after substitutions, 124 field-group edits (including 42 DOI links), author evidence, source URLs, and year-section moves. Checks do not permit any other citation text changes. One conflicting EDOC 2005 proposal and ten unresolved records remain unchanged. The design-choices issue year was independently corroborated against both the article metadata and the publisher's volume 64(3) issue listing (June 2026); the Information Systems 143 entry retains its existing 2026 citation year and explicitly identifies issue year 2027 without inventing an online year. The ACM survey uses Article 1 and a 58-page extent, not global issue pages. Existing PDFs, awards and all 111 entries remain. Native Jekyll/mobile limitations are unchanged.
