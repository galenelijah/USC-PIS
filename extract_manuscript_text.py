import pypdf
import os

pdf_path = "L_24-Final Manuscript.pdf"
output_path = "manuscript_text.txt"

def extract_text():
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found.")
        return

    try:
        reader = pypdf.PdfReader(pdf_path)
        with open(output_path, "w", encoding="utf-8") as f:
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    f.write(f"--- PAGE {i+1} ---\n")
                    f.write(text)
                    f.write("\n\n")
        print(f"Successfully extracted text to {output_path}")
    except Exception as e:
        print(f"Error extracting text: {e}")

if __name__ == "__main__":
    extract_text()
