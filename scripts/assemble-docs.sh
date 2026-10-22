#!/usr/bin/env sh
# Assembles the MkDocs source from README.md, format/ and diagrams/ so the repository files stay the single source.
set -eu
cd "$(dirname "$0")/.."

rm -rf docs
mkdir -p docs/diagrams docs/format
printf -- '---\nhide:\n  - navigation\n---\n\n' > docs/index.md
cat README.md >> docs/index.md
cp diagrams/*.svg docs/diagrams/

# On GitHub the concept lives in README.md, on the site in index.md.
for f in format/*.md; do
  sed 's#\.\./README\.md#../index.md#g' "$f" > "docs/$f"
done
