"""Run from the repository root: python3 _tests/check_preservation.py [baseline-ref]."""
from collections import Counter
from pathlib import Path
import re
import subprocess
import sys

baseline = sys.argv[1] if len(sys.argv) > 1 else "master"
def original(path):
    return subprocess.check_output(["git", "show", f"{baseline}:{path}"], text=True)
def content_lines(source):
    body = source.split("---", 2)[2]
    lines = []
    for line in body.splitlines():
        line = line.strip()
        if not line or line.startswith("<"):
            continue
        line = re.sub(r"^#+\s*|\s*#+$", "", line)
        lines.append(" ".join(line.split()))
    return Counter(lines)
for path in ["_pages/about.md", "_pages/publications.md", "_pages/teaching.md", "_pages/cv.md", "_pages/talks.md"]:
    old, new = original(path), Path(path).read_text()
    assert [x.rstrip() for x in old.split("---", 2)[1].splitlines()] == [x.rstrip() for x in new.split("---", 2)[1].splitlines()], f"Metadata/URLs changed: {path}"
    assert content_lines(old) == content_lines(new), f"Original wording changed: {path}"
    links = lambda s: Counter(re.findall(r"\]\(([^)]+)\)", s))
    assert not links(old) - links(new), f"Original resources lost: {path}"
    print("PASS preserved wording, metadata and links:", path)
about = Path("_pages/about.md").read_text()
assert about.index("I am currently") < about.index("My name") < about.index("/images/mountain.jpeg")
assert about.count("* TBA") == 2
assert 'alt=""' in about  # Decorative landscape, not an invented description.
publications = Path("_pages/publications.md").read_text()
for year in range(2021, 2027):
    assert f'href="#{year}"' in publications and f"### {year}\n" in publications
assert 'href="#older-articles"' in publications
assert 'aria-label="Toggle navigation"' in Path("_includes/masthead.html").read_text()
assert 'href="#main"' in Path("_layouts/default.html").read_text()
for layout in ("single", "archive"):
    assert 'id="main" role="main" tabindex="-1"' in Path(f"_layouts/{layout}.html").read_text()
assert 'replace: " at ", "@"' in Path("_includes/author-profile.html").read_text()
print("PASS hierarchy, placeholders, year links, skip targets and email template")
