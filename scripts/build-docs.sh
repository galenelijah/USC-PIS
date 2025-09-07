#!/usr/bin/env bash
set -euo pipefail

# Build consolidated documentation (Markdown, HTML, optional PDF via pandoc)

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$ROOT_DIR/docs"
OUT_DIR="$DOCS_DIR/build"
CONSOLIDATED_MD="$OUT_DIR/consolidated.md"
CONSOLIDATED_HTML="$OUT_DIR/consolidated.html"
CONSOLIDATED_PDF="$OUT_DIR/consolidated.pdf"

mkdir -p "$OUT_DIR"

echo "# USC‑PIS Consolidated Documentation" > "$CONSOLIDATED_MD"
echo >> "$CONSOLIDATED_MD"

append() {
  local title="$1"; shift
  local path="$1"; shift
  if [ -f "$path" ]; then
    echo >> "$CONSOLIDATED_MD"
    echo "\n\n<!-- ===== $title ===== -->\n\n" >> "$CONSOLIDATED_MD"
    echo "# $title" >> "$CONSOLIDATED_MD"
    echo >> "$CONSOLIDATED_MD"
    cat "$path" >> "$CONSOLIDATED_MD"
    echo >> "$CONSOLIDATED_MD"
  fi
}

# Core docs
append "Architecture Overview" "$DOCS_DIR/architecture/CODEBASE_OVERVIEW.md"
append "API Quick Reference" "$DOCS_DIR/api/README.md"
append "Deployment Guide" "$ROOT_DIR/backend/DEPLOYMENT_README.md"
append "Troubleshooting" "$ROOT_DIR/backend/DEPLOYMENT_TROUBLESHOOTING.md"
append "Endpoint Matrix" "$DOCS_DIR/api/ENDPOINT_MATRIX.md"

# Feature docs (stable order)
append "Authentication" "$DOCS_DIR/features/AUTHENTICATION.md"
append "Patients" "$DOCS_DIR/features/PATIENTS.md"
append "Health Info & Campaigns" "$DOCS_DIR/features/HEALTH_INFO.md"
append "Feedback" "$DOCS_DIR/features/FEEDBACK.md"
append "File Uploads" "$DOCS_DIR/features/FILE_UPLOADS.md"
append "Medical Certificates" "$DOCS_DIR/features/MEDICAL_CERTIFICATES.md"
append "Notifications" "$DOCS_DIR/features/NOTIFICATIONS.md"
append "Reports" "$DOCS_DIR/features/REPORTS.md"
append "Utilities & Backups" "$DOCS_DIR/features/UTILS_AND_BACKUPS.md"

# Topical docs
append "Health Campaigns (Topical)" "$DOCS_DIR/CAMPAIGNS.md"
append "Health Records UI Notes (Topical)" "$DOCS_DIR/HEALTH_RECORDS.md"

# HTML via pandoc if available
if command -v pandoc >/dev/null 2>&1; then
  pandoc "$CONSOLIDATED_MD" -s -o "$CONSOLIDATED_HTML"
  echo "Built HTML: $CONSOLIDATED_HTML"
  # PDF if wkhtmltopdf or a LaTeX engine is available
  if command -v wkhtmltopdf >/dev/null 2>&1; then
    pandoc "$CONSOLIDATED_MD" -s -o "$CONSOLIDATED_PDF" --pdf-engine=wkhtmltopdf || true
    [ -f "$CONSOLIDATED_PDF" ] && echo "Built PDF: $CONSOLIDATED_PDF"
  else
    # Try default LaTeX engine if installed
    pandoc "$CONSOLIDATED_MD" -s -o "$CONSOLIDATED_PDF" || true
    [ -f "$CONSOLIDATED_PDF" ] && echo "Built PDF: $CONSOLIDATED_PDF" || echo "PDF not built (missing pdf engine)"
  fi
else
  echo "pandoc not found; generated Markdown only: $CONSOLIDATED_MD"
fi

echo "Done. Consolidated docs at $CONSOLIDATED_MD"
