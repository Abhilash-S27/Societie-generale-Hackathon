"""
Converts RiskWaiver360_Video_Demo_Script.md to PDF via Chrome headless.
"""
import sys, os, subprocess, tempfile, pathlib
import markdown

MD_PATH  = pathlib.Path(__file__).parent / "RiskWaiver360_Video_Demo_Script.md"
PDF_PATH = pathlib.Path(__file__).parent / "RiskWaiver360_Video_Demo_Script.pdf"
HTML_TMP = pathlib.Path(tempfile.gettempdir()) / "riskwaiver360_video_script.html"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

CSS = """
@page {
  size: A4;
  margin: 18mm 18mm 20mm 18mm;
  @bottom-center {
    content: "RiskWaiver360 — Video Demo Script  |  Page " counter(page) " of " counter(pages);
    font-size: 8.5pt; color: #64748b;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
}
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', Calibri, Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.65;
  color: #1e293b; background: #fff; margin: 0;
}

/* ── headings ─────────────────────────────────── */
h1 {
  font-size: 20pt; font-weight: 800; color: #991b1b;
  margin: 0 0 6px 0; padding-bottom: 8px;
  border-bottom: 3px solid #dc2626;
  page-break-before: avoid;
}
h2 {
  font-size: 13pt; font-weight: 700; color: #991b1b;
  margin: 22px 0 8px 0; padding-bottom: 4px;
  border-bottom: 1.5px solid #fca5a5;
  page-break-after: avoid;
}
h3 {
  font-size: 11pt; font-weight: 700; color: #1e293b;
  margin: 16px 0 6px 0; page-break-after: avoid;
}
h4 {
  font-size: 10.5pt; font-weight: 700; color: #334155;
  margin: 12px 0 4px 0; page-break-after: avoid;
}

/* ── body text ────────────────────────────────── */
p { margin: 0 0 8px 0; }
a { color: #dc2626; text-decoration: none; }
strong { font-weight: 700; color: #0f172a; }
em { font-style: italic; color: #475569; }
ul, ol { margin: 4px 0 8px 22px; padding: 0; }
li { margin-bottom: 3px; }

/* ── spoken-dialogue blockquotes ─────────────── */
blockquote {
  border-left: 4px solid #dc2626;
  background: #fff7f7;
  margin: 8px 0;
  padding: 9px 14px;
  color: #1e293b;
  font-style: normal;
  border-radius: 0 5px 5px 0;
  page-break-inside: avoid;
}
blockquote p { margin: 0 0 4px 0; }
blockquote p:last-child { margin: 0; }

/* ── inline code (role labels, URLs, commands) ── */
code {
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 9pt;
  background: #f1f5f9; color: #dc2626;
  padding: 1px 5px; border-radius: 3px;
}

/* ── fenced code blocks (checklists, timelines) ─ */
pre {
  background: #0f172a; color: #e2e8f0;
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 8.5pt; line-height: 1.55;
  padding: 12px 14px; border-radius: 5px;
  border-left: 4px solid #dc2626;
  margin: 8px 0 12px 0;
  white-space: pre-wrap; word-break: break-all;
  page-break-inside: avoid;
}
pre code {
  background: transparent; color: #e2e8f0;
  padding: 0; border-radius: 0; font-size: inherit;
}

/* ── tables (timing plan, role switch table) ──── */
table {
  width: 100%; border-collapse: collapse;
  margin: 10px 0 14px 0; font-size: 9.5pt;
  page-break-inside: avoid;
}
thead tr { background: #991b1b; color: #fff; }
thead th {
  padding: 8px 10px; text-align: left;
  font-weight: 700; font-size: 9.5pt;
  border: 1px solid #7f1d1d;
}
tbody tr:nth-child(odd)  { background: #ffffff; }
tbody tr:nth-child(even) { background: #fff7f7; }
tbody td {
  padding: 6px 10px; border: 1px solid #e2e8f0;
  vertical-align: top; line-height: 1.45;
}

/* ── horizontal rules ─────────────────────────── */
hr {
  border: none; border-top: 1.5px solid #e2e8f0;
  margin: 18px 0;
}

/* ── presenter speaker labels ─────────────────── */
/* Bold [P1] and [P2] patterns stand out in blockquotes */

/* ── cover block ──────────────────────────────── */
.cover-block {
  text-align: center; padding: 32px 0 24px;
  border-bottom: 2px solid #dc2626; margin-bottom: 24px;
}
.cover-block h1 { border: none; font-size: 24pt; margin-bottom: 8px; }
.cover-sub { font-size: 12pt; color: #475569; margin-top: 4px; }
.cover-meta { font-size: 10pt; color: #94a3b8; margin-top: 8px; }
"""

COVER = """
<div class="cover-block">
  <h1>RiskWaiver360</h1>
  <p style="font-size:13pt;color:#991b1b;font-weight:700;margin:4px 0;">
    Video Demo Script
  </p>
  <p class="cover-sub">GRC Process Exception &amp; Policy Waiver Management Platform</p>
  <p class="cover-meta">Full 12–14 Minute Presentation &nbsp;·&nbsp; Two Presenters</p>
  <p class="cover-meta">P1: S Abhilash &nbsp;·&nbsp; P2: Rajath S</p>
  <p class="cover-meta" style="margin-top:12px;color:#dc2626;font-weight:600;">
    Société Générale Technology Hackathon — PS1
  </p>
</div>
"""


def md_to_html(text: str) -> str:
    exts = ["tables", "fenced_code", "toc", "nl2br", "sane_lists"]
    try:
        body = markdown.markdown(text, extensions=exts + ["codehilite"])
    except Exception:
        body = markdown.markdown(text, extensions=exts)
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>RiskWaiver360 — Video Demo Script</title>
<style>{CSS}</style>
</head>
<body>
{COVER}
{body}
</body>
</html>"""


def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    return None


def to_pdf_chrome(html_path: str, pdf_path: str, chrome: str) -> bool:
    cmd = [
        chrome,
        "--headless=new", "--disable-gpu", "--no-sandbox",
        "--disable-dev-shm-usage",
        f"--print-to-pdf={pdf_path}",
        "--print-to-pdf-no-header",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        f"file:///{html_path}",
    ]
    try:
        subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 10_000
    except Exception as e:
        print(f"  Chrome error: {e}")
        return False


def main():
    print(f"Input  : {MD_PATH}")
    print(f"Output : {PDF_PATH}")

    if not MD_PATH.exists():
        print("ERROR: Markdown not found."); sys.exit(1)

    text = MD_PATH.read_text(encoding="utf-8")
    print(f"Read   : {len(text):,} characters")

    html = md_to_html(text)
    HTML_TMP.write_text(html, encoding="utf-8")
    print(f"HTML   : {HTML_TMP}  ({len(html):,} chars)")

    chrome = find_chrome()
    if not chrome:
        print("ERROR: Chrome not found."); sys.exit(1)

    print(f"Method : Chrome headless  ({chrome})")
    ok = to_pdf_chrome(str(HTML_TMP).replace("\\", "/"), str(PDF_PATH), chrome)

    if ok:
        kb = os.path.getsize(PDF_PATH) / 1024
        print(f"\nPDF ready : {PDF_PATH}")
        print(f"Size      : {kb:.1f} KB  ({kb/1024:.2f} MB)")
        print(f"MD kept   : {MD_PATH.exists()}")
    else:
        print("\nERROR: PDF generation failed.")
        sys.exit(1)


if __name__ == "__main__":
    main()
