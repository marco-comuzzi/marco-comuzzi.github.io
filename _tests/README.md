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

The Python check compares original wording, resource links and page metadata against the baseline (pass a different ref as the first argument if needed). The DOM tests cover progressive search and navigation without a browser. Markdown-it is only a test renderer, not a replacement for the production Kramdown/Jekyll build. Existing deployment and framework remain unchanged. JavaScript-disabled visitors retain every publication and the year links. A browser review at desktop/mobile widths and a native Jekyll build are separate acceptance checks.
