"""
Generuje ikony PWA dla BookingHub (BH).
Wymaga: Pillow   (pip install pillow)
Font:   C:/Windows/Fonts/ariblk.ttf  (Arial Black)
"""

from PIL import Image, ImageDraw, ImageFont
import os, math

PURPLE   = (134, 59, 255, 255)   # #863bff
WHITE    = (255, 255, 255, 255)
FONT_TTF = r"C:\Windows\Fonts\ariblk.ttf"
OUT_DIR  = "public"

# ── helpers ────────────────────────────────────────────────────────────────────

def rounded_rect(img, radius, fill):
    mask = Image.new("L", img.size, 0)
    d    = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.width - 1, img.height - 1],
                        radius=radius, fill=255)
    bg = Image.new("RGBA", img.size, fill)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(bg, mask=mask)
    return out


def draw_bh(size, font_scale=0.52, corner_radius_frac=112/512, full_bleed=False):
    if full_bleed:
        img = Image.new("RGBA", (size, size), PURPLE)
    else:
        radius = max(4, round(size * corner_radius_frac))
        img = rounded_rect(Image.new("RGBA", (size, size), (0,0,0,0)),
                           radius, PURPLE)

    draw = ImageDraw.Draw(img)

    font_px = max(8, round(size * font_scale))
    font    = ImageFont.truetype(FONT_TTF, font_px)

    bbox = draw.textbbox((0, 0), "BH", font=font, stroke_width=0)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x  = (size - tw) / 2 - bbox[0]
    y  = (size - th) / 2 - bbox[1]
    y -= size * 0.02   # slight optical upward nudge

    draw.text((x, y), "BH", font=font, fill=WHITE)

    return img


# ── generate files ─────────────────────────────────────────────────────────────

specs = [
    ("pwa-64x64.png",                64,  False, 0.52),
    ("pwa-192x192.png",             192,  False, 0.52),
    ("pwa-512x512.png",             512,  False, 0.52),
    ("apple-touch-icon-180x180.png", 180, False, 0.52),
    ("maskable-icon-512x512.png",   512,  True,  0.42),
]

for filename, size, full_bleed, font_scale in specs:
    img  = draw_bh(size, font_scale=font_scale, full_bleed=full_bleed)
    path = os.path.join(OUT_DIR, filename)
    img.save(path, "PNG", optimize=True)
    print("OK  " + path)

ico_images = [draw_bh(s, corner_radius_frac=0.18) for s in (16, 32, 48)]
ico_path   = os.path.join(OUT_DIR, "favicon.ico")
ico_images[0].save(ico_path, format="ICO",
                   sizes=[(s, s) for s in (16, 32, 48)],
                   append_images=ico_images[1:])
print("OK  " + ico_path)
print("Done.")
