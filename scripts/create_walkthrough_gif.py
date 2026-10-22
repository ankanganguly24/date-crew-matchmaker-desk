from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
GUIDE = ROOT / "public" / "guide"
FRAMES = [
    ("01-profiles.png", "1   Start with five evidence-led matches"),
    ("02-review.png", "2   See alternatives when the pool is thin"),
    ("03-private-draft.png", "3   Review any must-have difference"),
    ("04-meeting-recorded.png", "4   Record what actually happened"),
    ("05-evidence.png", "5   Review this matchmaker's activity"),
]

font_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
if not Path(font_path).exists():
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
font = ImageFont.truetype(font_path, 19)
frames = []

for name, caption in FRAMES:
    image = Image.open(GUIDE / name).convert("RGB").resize((960, 540))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rectangle((0, 474, 960, 540), fill=(23, 58, 46, 255))
    draw.text((30, 493), caption, fill=(255, 255, 255, 255), font=font)
    frames.append(image.convert("P", palette=Image.Palette.ADAPTIVE, colors=128))

frames[0].save(
    GUIDE / "matchmaker-walkthrough.gif",
    save_all=True,
    append_images=frames[1:],
    duration=[2400, 2800, 2200, 2400, 2600],
    loop=0,
    disposal=2,
    optimize=True,
)
