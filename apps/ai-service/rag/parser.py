import io
import pdfplumber
import docx

def parse_document(file_content: bytes, mime_type: str) -> str:
    """
    Parses a document based on its mime type and returns plain text.
    """
    if mime_type == "application/pdf":
        text = ""
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        return text
    
    elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = docx.Document(io.BytesIO(file_content))
        return "\n".join([para.text for para in doc.paragraphs])
        
    elif mime_type in ["text/plain", "text/markdown"]:
        return file_content.decode("utf-8")
        
    else:
        raise ValueError(f"Unsupported mime type: {mime_type}")
