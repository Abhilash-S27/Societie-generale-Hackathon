"""
MD -> styled HTML -> PDF via Chrome headless.
Fallback: xhtml2pdf if Chrome launch fails.
"""
import sys, os, subprocess, tempfile, pathlib
import markdown

MD_PATH  = pathlib.Path(__file__).parent / "RiskWaiver360_Final_Documentation.md"
PDF_PATH = pathlib.Path(__file__).parent / "RiskWaiver360_Final_Documentation.pdf"
HTML_TMP = pathlib.Path(tempfile.gettempdir()) / "riskwaiver360_doc.html"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
]

CSS = """
@page {
  size: A4;
  margin: 22mm 20mm 22mm 20mm;
  @bottom-center {
    content: "RiskWaiver360 — GRC Process Exception & Policy Waiver Management Platform  |  Page " counter(page) " of " counter(pages);
    font-size: 9pt;
    color: #64748b;
    font-family: 'Segoe UI', Arial, sans-serif;
  }
}
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', Calibri, Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.65;
  color: #1e293b;
  background: #fff;
  margin: 0;
}
h1 {
  font-size: 22pt;
  font-weight: 800;
  color: #991b1b;
  margin: 0 0 6px 0;
  padding-bottom: 10px;
  border-bottom: 3px solid #dc2626;
  page-break-before: avoid;
}
h2 {
  font-size: 15pt;
  font-weight: 700;
  color: #991b1b;
  margin: 26px 0 10px 0;
  padding-bottom: 5px;
  border-bottom: 1.5px solid #fca5a5;
  page-break-after: avoid;
}
h3 {
  font-size: 12pt;
  font-weight: 700;
  color: #1e293b;
  margin: 18px 0 8px 0;
  page-break-after: avoid;
}
h4 {
  font-size: 11pt;
  font-weight: 700;
  color: #334155;
  margin: 14px 0 6px 0;
  page-break-after: avoid;
}
p { margin: 0 0 10px 0; }
a { color: #dc2626; text-decoration: none; }
strong { font-weight: 700; color: #0f172a; }
em { font-style: italic; }
ul, ol { margin: 6px 0 10px 22px; padding: 0; }
li { margin-bottom: 4px; }
code {
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 9.5pt;
  background: #f1f5f9;
  color: #dc2626;
  padding: 1px 5px;
  border-radius: 3px;
}
pre {
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Cascadia Code', 'Consolas', 'Courier New', monospace;
  font-size: 9pt;
  line-height: 1.55;
  padding: 14px 16px;
  border-radius: 6px;
  border-left: 4px solid #dc2626;
  margin: 10px 0 14px 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  page-break-inside: avoid;
}
pre code {
  background: transparent;
  color: #e2e8f0;
  padding: 0;
  border-radius: 0;
  font-size: inherit;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 16px 0;
  font-size: 10pt;
  page-break-inside: avoid;
}
thead tr {
  background: #991b1b;
  color: #fff;
}
thead th {
  padding: 9px 12px;
  text-align: left;
  font-weight: 700;
  font-size: 10pt;
  border: 1px solid #7f1d1d;
}
tbody tr:nth-child(odd)  { background: #fff; }
tbody tr:nth-child(even) { background: #fff7f7; }
tbody td {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  vertical-align: top;
  line-height: 1.5;
}
blockquote {
  border-left: 4px solid #fca5a5;
  background: #fff7f7;
  margin: 10px 0;
  padding: 10px 16px;
  color: #475569;
  font-style: italic;
  border-radius: 0 6px 6px 0;
}
hr {
  border: none;
  border-top: 1.5px solid #e2e8f0;
  margin: 22px 0;
}
.cover-block {
  text-align: center;
  padding: 40px 0 30px;
  border-bottom: 2px solid #dc2626;
  margin-bottom: 28px;
  page-break-after: avoid;
}
.cover-block h1 {
  border: none;
  font-size: 26pt;
  margin-bottom: 10px;
}
.cover-sub {
  font-size: 13pt;
  color: #475569;
  margin-top: 6px;
}
"""

COVER_EXTRA = """
<div class="cover-block">
  <h1>RiskWaiver360</h1>
  <p style="font-size:14pt;color:#991b1b;font-weight:700;margin:4px 0;">
    GRC Process Exception &amp; Policy Waiver Management Platform
  </p>
  <p class="cover-sub">Final Hackathon Submission Documentation</p>
  <p class="cover-sub" style="margin-top:4px;">Société Générale Technology Hackathon — PS1</p>
</div>
"""

def md_to_html(md_text: str) -> str:
    extensions = ["tables", "fenced_code", "codehilite", "toc", "nl2br", "sane_lists"]
    try:
        body = markdown.markdown(md_text, extensions=extensions)
    except Exception:
        body = markdown.markdown(md_text, extensions=["tables", "fenced_code", "toc"])
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RiskWaiver360 — Final Documentation</title>
<style>{CSS}</style>
</head>
<body>
{COVER_EXTRA}
{body}
</body>
</html>"""
    return html


def find_chrome() -> str | None:
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    return None


def pdf_via_chrome(html_path: str, pdf_path: str, chrome: str) -> bool:
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        f"--print-to-pdf={pdf_path}",
        "--print-to-pdf-no-header",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        f"file:///{html_path}",
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 10_000
    except Exception as e:
        print(f"  Chrome error: {e}")
        return False


def pdf_via_xhtml2pdf(html_path: str, pdf_path: str) -> bool:
    try:
        from xhtml2pdf import pisa
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
        with open(pdf_path, "wb") as pdf_file:
            result = pisa.CreatePDF(html_content, dest=pdf_file)
        return not result.err and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 5_000
    except Exception as e:
        print(f"  xhtml2pdf error: {e}")
        return False


def main():
    print(f"Input  : {MD_PATH}")
    print(f"Output : {PDF_PATH}")

    if not MD_PATH.exists():
        print("ERROR: Markdown file not found.")
        sys.exit(1)

    md_text = MD_PATH.read_text(encoding="utf-8")
    print(f"Read   : {len(md_text):,} characters")

    html = md_to_html(md_text)
    HTML_TMP.write_text(html, encoding="utf-8")
    print(f"HTML   : {HTML_TMP} ({len(html):,} chars)")

    chrome = find_chrome()
    success = False

    if chrome:
        print(f"Method : Chrome headless ({chrome})")
        success = pdf_via_chrome(str(HTML_TMP).replace("\\", "/"), str(PDF_PATH), chrome)
        if success:
            print(f"Chrome : SUCCESS")
        else:
            print(f"Chrome : FAILED — trying xhtml2pdf fallback")

    if not success:
        print("Method : xhtml2pdf fallback")
        success = pdf_via_xhtml2pdf(str(HTML_TMP), str(PDF_PATH))
        if success:
            print("xhtml2pdf : SUCCESS")
        else:
            print("xhtml2pdf : FAILED")

    if success:
        size_kb = os.path.getsize(PDF_PATH) / 1024
        size_mb = size_kb / 1024
        print(f"\nPDF ready : {PDF_PATH}")
        print(f"Size      : {size_kb:.1f} KB  ({size_mb:.2f} MB)")
        print(f"MD kept   : {MD_PATH.exists()}")
    else:
        print("\nERROR: PDF generation failed with all methods.")
        sys.exit(1)


if __name__ == "__main__":
    main()
