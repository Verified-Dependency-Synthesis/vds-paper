#!/usr/bin/env sh
# Assembles the MkDocs source from README.md and diagrams/ so the README stays the single source.
set -eu
cd "$(dirname "$0")/.."

rm -rf docs
mkdir -p docs/diagrams
printf -- '---\nhide:\n  - navigation\n---\n\n' > docs/index.md
cat README.md >> docs/index.md
cp diagrams/*.svg docs/diagrams/
