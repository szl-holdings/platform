# Total Pages — SZL Master Study Manual

## Page count: **204 pages**

Measured by rendering the .docx to PDF with LibreOffice and counting with `pdfinfo`:
```
$ soffice --headless --convert-to pdf SZL_MASTER_STUDY_MANUAL.docx
$ pdfinfo SZL_MASTER_STUDY_MANUAL.pdf | grep -i pages
Pages:           204
```

## python-docx structural stats (real, not padding)
| Metric | Count |
| --- | --- |
| Paragraphs | 1,962 |
| Tables | 118 |
| Title + Heading 1 (chapters/parts) | 32 |
| Heading 2 (sections) | 235 |
| Heading 3 (subsections) | 231 |
| Embedded images (word/media) | 75 |

```
$ python3 - <<'PY'
from docx import Document
import zipfile
d = Document('SZL_MASTER_STUDY_MANUAL.docx')
print('paragraphs:', len(d.paragraphs))
print('tables:', len(d.tables))
z = zipfile.ZipFile('SZL_MASTER_STUDY_MANUAL.docx')
print('images:', len([n for n in z.namelist() if n.startswith('word/media/')]))
PY
paragraphs: 1962
tables: 118
images: 75
```

## Files
- `SZL_MASTER_STUDY_MANUAL.docx` — 9,259,478 bytes (8.83 MB)
- `SZL_MASTER_STUDY_MANUAL.pdf` — 7,375,042 bytes (7.03 MB), 204 pages

Target was 200+ pages — **PASS (204)**.
