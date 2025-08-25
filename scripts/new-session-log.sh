#!/usr/bin/env bash
set -euo pipefail

# Create a dated session log in docs/session-notes/
# Usage: scripts/new-session-log.sh "Brief summary for this session"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NOTES_DIR="$ROOT_DIR/docs/session-notes"
DATE_STR="$(date +%F)"
FILE_PATH="$NOTES_DIR/${DATE_STR}-session-log.md"

mkdir -p "$NOTES_DIR"

SUMMARY=${1:-"Session notes"}

cat > "$FILE_PATH" <<EOF
# Session Log — $DATE_STR

## Summary
- $SUMMARY

## Changes (high-level)
- 

## Issues Tracked
- See OPEN_ISSUES.md

## Decisions
- 

## Next Actions
- 

## References
- Contributor guide: AGENTS.md
- Open issues: OPEN_ISSUES.md
- Change list: SESSION_CHANGES.md
EOF

echo "Created $FILE_PATH"

