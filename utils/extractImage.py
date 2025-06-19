import fitz  # PyMuPDF
import sys, os, json, uuid
import pytesseract
from PIL import Image

pdf_path = sys.argv[1]
output_dir = "./uploads/images"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
images = []

for page_index in range(len(doc)):
    page = doc[page_index]
    image_list = page.get_images(full=True)

    for img_index, img in enumerate(image_list):
        xref = img[0]
        pix = fitz.Pixmap(doc, xref)

        try:
            # Convert CMYK or grayscale to RGB
            if pix.n >= 5:  # CMYK or similar
                pix = fitz.Pixmap(fitz.csRGB, pix)

            image_filename = f"page{page_index+1}_img{img_index+1}_{uuid.uuid4().hex}.png"
            image_path = os.path.join(output_dir, image_filename)
            pix.save(image_path)

            # Skip empty or invalid images
            if not os.path.exists(image_path) or os.path.getsize(image_path) < 1024:
                print(f"⚠️ Skipped invalid image: {image_filename}", file=sys.stderr)
                os.remove(image_path)
                continue

            # OCR processing
            try:
                img = Image.open(image_path)
                ocr_text = pytesseract.image_to_string(img)
            except Exception as e:
                ocr_text = ""
                print(f"❌ OCR failed for {image_filename}: {e}", file=sys.stderr)

            images.append({
                "page": page_index + 1,
                "imageUrl": f"/uploads/images/{image_filename}",
                "ocrText": ocr_text.strip()
            })

        except Exception as e:
            print(f"❌ Error processing image on page {page_index+1}: {e}", file=sys.stderr)
        finally:
            pix = None  # Free memory

print(json.dumps(images, ensure_ascii=False))
