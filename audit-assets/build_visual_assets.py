"""Copy the curated LS image set and build responsive derivatives and manifest."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path

from PIL import Image, ImageOps


def image_id(source_path: str) -> str:
    return "img-" + hashlib.sha1(source_path.encode("utf-8")).hexdigest()[:12]


def localized_alt(subject: str, category: str = "") -> dict[str, str]:
    subject = subject.strip()
    prefix = f"{category} " if category else ""
    return {
        "en": f"LS website image: {prefix}{subject}".strip(),
        "zh": f"LS 网站图片：{subject}".strip(),
        "ms": f"Imej laman LS: {subject}".strip(),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--workspace", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()

    source_root = args.source_root.resolve()
    workspace = args.workspace.resolve()
    machine_map = json.loads((workspace / "audit-assets/catalogue-image-map.json").read_text(encoding="utf-8"))

    sections = {
        "brand": "uploads/2025/06/LS-Machinery-Logo-Innovation-10.png",
        "homepageHero": "uploads/2025/11/LSF-502-MCD-Mini-Cookies-Depositor.png",
        "currentProduction": "uploads/2025/05/78c980a32569e0275822ffb9b0efab19badf8493.jpg",
        "introPoster": "uploads/2025/06/LS-building.webp",
        "building": "uploads/2025/06/LS-building.webp",
        "foods": {
            "cookies-biscuits": "uploads/2025/11/Lemon-Butter-Cookies-Recipe17.jpg",
            "cakes": "uploads/2024/12/Hotel-Line-2.png",
            "bread-buns": "uploads/2026/04/milk-bread.webp",
            "pastries-crusted-foods": "uploads/2024/12/Frozen-Line-2.png",
            "kueh-asian-foods": "uploads/2024/12/Kuih-Line-2.png",
            "dim-sum": "uploads/2024/12/Dumpling-Line-2.png",
        },
        "segments": {
            "micro-startup-businesses": "uploads/2025/11/Lemon-Butter-Cookies-Recipe17.jpg",
            "smes-expanding-manufacturers": "uploads/2025/11/LSF-502-MCD-Mini-Cookies-Depositor.png",
            "large-mega-enterprises": "uploads/2025/06/Webs-05.jpg",
        },
        "solutions": {
            "factory-line-planning": "uploads/2025/06/LS-building.webp",
            "machinery-automation": "uploads/2025/06/Webs-05.jpg",
            "facility-fit-out": "uploads/2025/03/Cleanroom-Panelling-System-Image-2.png",
            "financing-support": "uploads/2025/03/Financial-Assistant-Image-2.png",
        },
        "services": "uploads/2025/05/7475611c80c677b5fc266f630dc9d1293275e77d.jpg",
        "company": "uploads/2024/12/About-us-Company-Photo.jpeg",
        "news": "uploads/2025/06/LS-building.webp",
        "history": {
            "beginning": "uploads/2025/05/f4700b21e6bfd65b5555ab948d17fe809ac02c3f.jpg",
            "early-phases": "uploads/2025/05/f04a460e9f5c77c590b63f602d4add78fe4ca2a1.jpg",
            "cruiser-period": "uploads/2025/05/7475611c80c677b5fc266f630dc9d1293275e77d.jpg",
            "new-chapter": "uploads/2025/05/75ef1db0551e6b06aba75f7d7470b8934d479249-1.jpg",
        },
        "customerExperiences": {
            "photo-1": "uploads/2024/12/Gallery-Image-1.jpeg",
            "photo-2": "uploads/2024/12/Gallery-Image-2.jpeg",
            "photo-3": "uploads/2024/12/Gallery-Image-3.jpeg",
            "photo-4": "uploads/2024/12/Gallery-Image-4.jpeg",
            "photo-5": "uploads/2024/12/Gallery-Image-5.jpeg",
            "photo-6": "uploads/2024/12/Gallery-Image-6.jpeg",
            "photo-7": "uploads/2024/12/Gallery-Image-7.jpeg",
            "photo-8": "uploads/2024/12/Gallery-Image-8.jpeg",
            "photo-9": "uploads/2024/12/Gallery-Image-9.jpeg",
            "photo-10": "uploads/2024/12/Gallery-Iamge-10-scaled.jpeg",
        },
        "clients": {
            "gardenia": "uploads/2024/12/Gardenia-image-1.png",
            "tk-bakery": "uploads/2025/03/TK-LOGO.png",
        },
        "careers": {
            "recruitment": "uploads/2024/12/Career-Image-1.png",
            "team": "uploads/2024/12/Career-Page-Video-Image.png",
        },
    }

    extras = {
        "uploads/2025/06/LS-Machinery-Logo-Innovation-10.png": "LS Machinery Innovation logo",
        "uploads/2025/06/LS-building.webp": "LS premises in Malaysia",
        "uploads/2025/06/Webs-05.jpg": "LS machinery collage with original artwork lettering",
        "uploads/2024/12/About-us-Company-Photo.jpeg": "LS team group photograph",
        "uploads/2025/05/f4700b21e6bfd65b5555ab948d17fe809ac02c3f.jpg": "LS machinery and delivery at an earlier company site",
        "uploads/2025/05/f04a460e9f5c77c590b63f602d4add78fe4ca2a1.jpg": "Food machinery inside an LS workshop",
        "uploads/2025/05/7475611c80c677b5fc266f630dc9d1293275e77d.jpg": "LS team inspecting food machinery",
        "uploads/2025/05/75ef1db0551e6b06aba75f7d7470b8934d479249-1.jpg": "LS Smart Machinery premises",
        "uploads/2024/12/Gallery-Image-1.jpeg": "Food-production equipment at a customer site",
        "uploads/2024/12/Gallery-Image-2.jpeg": "People and equipment in a food-production setting",
        "uploads/2024/12/Gallery-Image-3.jpeg": "Food-production equipment at a customer site",
        "uploads/2024/12/Gallery-Image-4.jpeg": "People and equipment in a food-production setting",
        "uploads/2024/12/Gallery-Image-5.jpeg": "Food-production equipment at a customer site",
        "uploads/2024/12/Gallery-Image-6.jpeg": "People and equipment in a food-production setting",
        "uploads/2024/12/Gallery-Image-7.jpeg": "Food-production equipment at a customer site",
        "uploads/2024/12/Gallery-Image-8.jpeg": "People and equipment in a food-production setting",
        "uploads/2024/12/Gallery-Image-9.jpeg": "Food-production equipment at a customer site",
        "uploads/2024/12/Gallery-Iamge-10-scaled.jpeg": "People and equipment in a food-production setting",
        "uploads/2024/12/Gardenia-image-1.png": "Gardenia customer logo shown on LS's published site",
        "uploads/2025/03/TK-LOGO.png": "TK Bakery logo shown on LS's published site",
        "uploads/2024/12/Career-Image-1.png": "LS representative at a recruitment booth",
        "uploads/2024/12/Career-Page-Video-Image.png": "LS colleagues at work",
        "uploads/2025/03/Cleanroom-Panelling-System-Image-2.png": "Clean-room paneling capability illustration",
        "uploads/2025/03/Financial-Assistant-Image-2.png": "Financial assistance capability illustration",
        "uploads/2025/11/Lemon-Butter-Cookies-Recipe17.jpg": "Cookie food application image",
        "uploads/2026/04/milk-bread.webp": "Bread food application image",
    }
    section_alt = {
        "uploads/2025/06/LS-Machinery-Logo-Innovation-10.png": localized_alt("LS Machinery Innovation logo"),
        "uploads/2025/06/LS-building.webp": localized_alt("LS premises in Malaysia"),
        "uploads/2025/06/Webs-05.jpg": localized_alt("LS machinery collage; equipment examples only"),
        "uploads/2024/12/About-us-Company-Photo.jpeg": localized_alt("LS team group photograph"),
        "uploads/2025/05/f4700b21e6bfd65b5555ab948d17fe809ac02c3f.jpg": localized_alt("LS machinery delivery at an earlier company site"),
        "uploads/2025/05/f04a460e9f5c77c590b63f602d4add78fe4ca2a1.jpg": localized_alt("food machinery in an LS workshop"),
        "uploads/2025/05/7475611c80c677b5fc266f630dc9d1293275e77d.jpg": localized_alt("LS team inspecting food machinery"),
        "uploads/2025/05/75ef1db0551e6b06aba75f7d7470b8934d479249-1.jpg": localized_alt("LS Smart Machinery premises"),
        "uploads/2024/12/Gallery-Image-1.jpeg": localized_alt("food-production equipment at a customer site"),
        "uploads/2024/12/Gallery-Image-2.jpeg": localized_alt("people and equipment in a food-production setting"),
        "uploads/2024/12/Gallery-Image-3.jpeg": localized_alt("food-production equipment at a customer site"),
        "uploads/2024/12/Gallery-Image-4.jpeg": localized_alt("people and equipment in a food-production setting"),
        "uploads/2024/12/Gallery-Image-5.jpeg": localized_alt("food-production equipment at a customer site"),
        "uploads/2024/12/Gallery-Image-6.jpeg": localized_alt("people and equipment in a food-production setting"),
        "uploads/2024/12/Gallery-Image-7.jpeg": localized_alt("food-production equipment at a customer site"),
        "uploads/2024/12/Gallery-Image-8.jpeg": localized_alt("people and equipment in a food-production setting"),
        "uploads/2024/12/Gallery-Image-9.jpeg": localized_alt("food-production equipment at a customer site"),
        "uploads/2024/12/Gallery-Iamge-10-scaled.jpeg": localized_alt("people and equipment in a food-production setting"),
        "uploads/2024/12/Gardenia-image-1.png": localized_alt("Gardenia logo"),
        "uploads/2025/03/TK-LOGO.png": localized_alt("TK Bakery logo"),
        "uploads/2024/12/Career-Image-1.png": localized_alt("LS representative at a recruitment booth"),
        "uploads/2024/12/Career-Page-Video-Image.png": localized_alt("LS colleagues at work"),
        "uploads/2025/03/Cleanroom-Panelling-System-Image-2.png": localized_alt("clean-room paneling capability illustration; not project proof"),
        "uploads/2025/03/Financial-Assistant-Image-2.png": localized_alt("financial assistance capability illustration; terms need confirmation"),
        "uploads/2026/05/LS-Machine-Thumbnails-2025-Web-25.png": localized_alt("cooker mixer machine; model details unconfirmed"),
        "uploads/2026/05/LS-Machine-Thumbnails-2025-Web-48.png": localized_alt("KRONO-branded donut-forming machine; model details unconfirmed"),
        "uploads/2025/11/Lemon-Butter-Cookies-Recipe17.jpg": localized_alt("cookie food application"),
        "uploads/2026/04/milk-bread.webp": localized_alt("bread food application"),
        "uploads/2024/12/Hotel-Line-2.png": localized_alt("cake and pastry food application"),
        "uploads/2024/12/Frozen-Line-2.png": localized_alt("croissant food application"),
        "uploads/2024/12/Kuih-Line-2.png": localized_alt("kueh food application"),
        "uploads/2024/12/Dumpling-Line-2.png": localized_alt("dim sum food application"),
    }

    source_subject = {record["source_path"]: record["name"] for record in machine_map["records"]}
    for source_path, subject in extras.items():
        source_subject.setdefault(source_path, subject)
    all_paths = set(source_subject)
    for value in sections.values():
        all_paths.update(value.values() if isinstance(value, dict) else [value])

    missing_sources = sorted(path for path in all_paths if not source_root.joinpath(*path.split("/")).is_file())
    if missing_sources:
        raise FileNotFoundError("Audited sources are missing:\n" + "\n".join(missing_sources))

    image_dir = workspace / "assets/images"
    originals_dir = image_dir / "source"
    responsive_dir = image_dir / "responsive"
    originals_dir.mkdir(parents=True, exist_ok=True)
    responsive_dir.mkdir(parents=True, exist_ok=True)

    image_records: dict[str, dict] = {}
    source_ids: dict[str, str] = {}
    for source_path in sorted(all_paths):
        source = source_root.joinpath(*source_path.split("/"))
        if not source.is_file():
            raise FileNotFoundError(f"Audited source is missing: {source_path}")
        key = image_id(source_path)
        source_ids[source_path] = key
        raw = source.read_bytes()
        suffix = source.suffix.lower() or ".img"
        original_relative = Path("assets/images/source") / f"{key}{suffix}"
        original_target = workspace / original_relative
        source_digest = hashlib.sha256(raw).digest()
        source_changed = not original_target.exists() or hashlib.sha256(original_target.read_bytes()).digest() != source_digest
        if source_changed:
            shutil.copyfile(source, original_target)

        with Image.open(source) as original:
            converted = ImageOps.exif_transpose(original).convert("RGBA" if "A" in original.getbands() else "RGB")
            source_width, source_height = converted.size
            ratio = source_height / source_width
            # Include a small-density option for compact logos and other source
            # assets below the first standard breakpoint. Never upscale above
            # the source width.
            target_widths = (120, source_width) if source_width < 480 else (480, 800, 1280)
            widths = sorted(set(min(target, source_width) for target in target_widths))
            sizes: dict[str, str] = {}
            for width in widths:
                height = max(1, round(width * ratio))
                resized = converted.resize((width, height), Image.Resampling.LANCZOS)
                relative = Path("assets/images/responsive") / f"{key}-w{width}.webp"
                target = workspace / relative
                if source_changed or not target.exists():
                    resized.save(target, format="WEBP", quality=86, method=6)
                sizes[str(width)] = relative.as_posix()

        if source_path in section_alt:
            alt = section_alt[source_path]
        else:
            machine = source_subject.get(source_path, Path(source_path).stem.replace("-", " "))
            category = next((record["category"] for record in machine_map["records"] if record["source_path"] == source_path), "")
            alt = localized_alt(f"catalogue machine image for {machine}", category)
        image_records[key] = {
            "width": source_width,
            "height": source_height,
            "alt": alt,
            "source": source_path,
            "sha256": source_digest.hex(),
            "original": original_relative.as_posix(),
            "sizes": sizes,
        }

    catalogue: dict[str, dict] = {}
    for item in machine_map["records"]:
        fallback_label = None
        if item["match_type"] != "exact":
            fallback_label = {
                "en": item["fallback_label"] or "Category reference image; exact model not confirmed.",
                "zh": "类别参考图片；具体型号尚未确认。",
                "ms": "Imej rujukan kategori; model khusus belum disahkan.",
            }
        catalogue[item["name"]] = {
            "image": source_ids[item["source_path"]],
            "match": "exact" if item["match_type"] == "exact" else "category",
            "label": fallback_label,
            "source": item["source_path"],
            "evidence": item["evidence"],
            "confidence": item["confidence"],
        }

    section_refs = {}
    for key, value in sections.items():
        section_refs[key] = ({slug: source_ids[path] for slug, path in value.items()} if isinstance(value, dict) else source_ids[value])
    captions = {}
    manifest = {
        "source": "Curated from the read-only LS website backup; see each image source, hash, and catalogue evidence.",
        "images": image_records,
        "catalogue": catalogue,
        "sections": section_refs,
        "captions": captions,
        "categoryFallbacks": {},
        "media": {
            "introVideo": "https://d2ol7oe51mr4n9.cloudfront.net/user_3K1dzlfNKnh8rdOmn5WxeEPvHm9/777e9cbe-1224-4086-91b6-f441c1ed48ff.mp4",
        },
    }
    (workspace / "asset-manifest.js").write_text("window.LS_ASSET_MANIFEST = " + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    (workspace / "audit-assets/asset-source-index.json").write_text(json.dumps({"images": {key: {"source": value["source"], "sha256": value["sha256"], "original": value["original"]} for key, value in image_records.items()}, "sections": section_refs, "catalogue": {name: {"source": value["source"], "evidence": value["evidence"], "confidence": value["confidence"], "match": value["match"], "image": value["image"], "label": value["label"]} for name, value in catalogue.items()}}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(image_records)} sourced image records and {len(catalogue)} catalogue assignments.")


def slug(value: str) -> str:
    import re
    import unicodedata
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"(^-|-$)", "", re.sub(r"[^a-z0-9]+", "-", value))


if __name__ == "__main__":
    main()
