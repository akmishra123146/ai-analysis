import sys
import os

try:
    import pypdf
except ImportError:
    os.system("python3 -m pip install --break-system-packages pypdf")
    import pypdf

def convert(pdf_path, txt_path):
    reader = pypdf.PdfReader(pdf_path)
    content = []
    for i, p in enumerate(reader.pages):
        content.append(f"--- PAGE {i+1} ---")
        content.append(p.extract_text() or "")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(content))
    print(f"Done {pdf_path} -> {txt_path} ({len(content)} lines)")

convert("/Users/asus/Desktop/task/Zignuts_Task4_PRD_CRM_AI_Analytics.pdf", "/Users/asus/Desktop/task/prd1.txt")
convert("/Users/asus/Desktop/task/Zignuts_Candidate_Task4_CRM_AI_Analytics.pdf", "/Users/asus/Desktop/task/prd2.txt")
