"""Remove backgrounds from product photos and tightly crop to the product.

Runs the cached u2netp ONNX model directly via onnxruntime (no rembg import,
so it avoids the pymatting/numba dependency chain). Outputs transparent PNG
cut-outs next to the originals with a `-cut` suffix.
"""
import os
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

BASE = os.path.join(os.path.dirname(__file__), "..", "public", "images")
MODEL = os.path.expanduser("~/.u2net/u2netp.onnx")

# (input filename, output filename) — clean transparent cut-outs with no spaces.
TARGETS = [
    ("tela cut.png", "tela-clean.png"),
    ("tej cut.png", "tej-clean.png"),
    ("red peper cut.png", "berbere-clean.png"),
    ("shiro powder cut.png", "shiro-clean.png"),
]

MEAN = np.array([0.485, 0.456, 0.406])
STD = np.array([0.229, 0.224, 0.225])
SIZE = (320, 320)

session = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
INPUT = session.get_inputs()[0].name


def predict_mask(img: Image.Image) -> Image.Image:
    im = img.convert("RGB").resize(SIZE, Image.LANCZOS)
    arr = np.array(im) / 255.0
    arr = arr / max(np.max(arr), 1e-6)
    tmp = np.zeros((SIZE[1], SIZE[0], 3))
    for c in range(3):
        tmp[:, :, c] = (arr[:, :, c] - MEAN[c]) / STD[c]
    tmp = tmp.transpose((2, 0, 1))[np.newaxis, :, :, :].astype(np.float32)

    pred = session.run(None, {INPUT: tmp})[0][:, 0, :, :]
    pred = np.squeeze(pred)
    mn, mx = pred.min(), pred.max()
    pred = (pred - mn) / max(mx - mn, 1e-6)
    mask = Image.fromarray((pred * 255).astype("uint8"), mode="L")
    return mask.resize(img.size, Image.LANCZOS)


def process(name: str, out_name: str) -> None:
    src = os.path.join(BASE, name)
    if not os.path.exists(src):
        print(f"skip (missing): {name}")
        return

    with Image.open(src) as im:
        rgba = im.convert("RGBA")
        sal = np.array(predict_mask(rgba)).astype(np.float32)  # saliency 0..255

        rgb = np.array(rgba.convert("RGB")).astype(np.int16)
        mx = rgb.max(axis=2)
        mn = rgb.min(axis=2)
        sat = mx - mn  # colourfulness (0 = grey)
        bright = mx

        # The transparency checkerboard is a desaturated, light grey grid. Key it out by
        # colour so faint-but-coloured product parts (e.g. the clear tej neck) survive even
        # where the saliency model is unsure.
        gray_bg = (sat < 30) & (bright > 150)
        is_bg = (gray_bg & (sal < 175)) | ((sal < 40) & (sat < 22))

        alpha = np.full(sal.shape, 255, dtype=np.uint8)
        alpha[is_bg] = 0
        a = Image.fromarray(alpha, mode="L")
        # Close tiny specks/holes without eating into the product silhouette.
        a = a.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
        rgba.putalpha(a)

    bbox = rgba.getbbox()  # tight crop to the product
    if bbox:
        rgba = rgba.crop(bbox)

    out = os.path.join(BASE, out_name)
    rgba.save(out)
    print(f"done: {os.path.basename(out)}  size={rgba.size}")


if __name__ == "__main__":
    for src_name, out_name in TARGETS:
        process(src_name, out_name)
    print("ALL DONE")
