"""Run from the repository root: python3 _tests/check_preservation.py [baseline-ref]."""
from collections import Counter
from pathlib import Path
import re
import json
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
    original_links = Counter(re.findall(r"\]\(([^)]+)\)", old))
    if path == "_pages/publications.md":
        approved = json.loads(Path("_tests/approved-publications.json").read_text())
        assert len(approved["changes"]) == 42
        for change in approved["changes"]:
            before, after = change["before"], change["after"]
            assert old.count(before) == 1, f"Baseline citation not unique: {change['id']}"
            assert new.count(after) == 1, f"Approved citation not unique: {change['id']}"
            assert change["sources"] and change["authors"] and change["fields"]
            old = old.replace(before, after, 1)
            assert f"[DOI](https://doi.org/" in after
            if "target_section" in change:
                position = new.index(after)
                headings = re.findall(r"^#{2,3} (.+)$", new[:position], re.M)
                assert headings[-1] == change["target_section"], f"Wrong year section: {change['id']}"
        for record in approved["deferred"] + approved["unresolved_untouched"]:
            assert new.count(record["before"]) == 1, f"Unresolved citation changed: {record['id']}"
        print("PASS 42 exact approved citation substitutions, year placement and 11 deferred/unresolved records")
    assert [x.rstrip() for x in old.split("---", 2)[1].splitlines()] == [x.rstrip() for x in new.split("---", 2)[1].splitlines()], f"Metadata/URLs changed: {path}"
    assert content_lines(old) == content_lines(new), f"Original wording changed: {path}"
    links = lambda s: Counter(re.findall(r"\]\(([^)]+)\)", s))
    assert not original_links - links(new), f"Original resources lost: {path}"
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

# Explicitly approved exception: shorten only the globally shared sidebar bio.
old_bio = "I am Associate Professor at the Department of Industrial Engineering, Ulsan National Institute of Science and Technology, Ulsan, in Korea. My research focuses on process mining and blockchain systems."
new_bio = "Researching process mining, blockchain and information systems."
old_config = original("_config.yml")
assert old_config.count(old_bio) == 1
assert Path("_config.yml").read_text() == old_config.replace(old_bio, new_bio)
assert "{{ author.bio }}" in Path("_includes/author-profile.html").read_text()
for path in ["_pages/about.md", "_pages/publications.md", "_pages/teaching.md", "_pages/cv.md", "_pages/talks.md"]:
    assert not re.search(r"^author:\s*\S", Path(path).read_text(), re.M), f"Unexpected sidebar author override: {path}"
assert "I am currently Associate Professor and Director of the Blockchain Research Center" in about
print("PASS only approved shared sidebar bio substitution; full homepage role retained")
