import io

import pdfplumber
from fastapi import HTTPException


def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        text_chunks: list[str] = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_chunks.append(page_text)
        text = "\n".join(text_chunks).strip()
    except Exception as exc:  # pdfplumber raises varied exceptions for corrupt PDFs
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}") from exc

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF. Try pasting the resume text instead.",
        )
    return text
