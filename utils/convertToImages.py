import fitz
import os
import sys
import json

pdf_path = sys.argv[1]
output_dir = "uploads/images"
os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
images = []

for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=200)
    image_name = f"page_{i+1}.png"
    image_path = os.path.join(output_dir, image_name)
    pix.save(image_path)
    images.append({ "page": i + 1, "imageUrl": f"{output_dir}/{image_name}" })

print(json.dumps(images))
