"""Mascot look ids the backend accepts (B19). This is the one place for them on the backend side, and it mirrors
the frontend's lists in frontend/src/pip2d: ACCESSORIES_2D (y2k.jsx), CLUB_ACCESSORIES (club.jsx) and EARNED_ITEMS
(earned.jsx). tests/backend/test_mascot.py fails if the two sides drift apart."""

BASE_ACCESSORIES = ("none", "glasses", "scarf", "pencil", "badge", "backpack", "starclips", "charm", "visor", "shades")
CLUB_ACCESSORIES = ("shades_neon", "chain", "puffer", "headphones_dj")
EARNED_ITEMS = ("half_pin", "fixed_it_star")
LEGACY_ACCESSORIES = ("cap", "headphones")  # still accepted from older clients
ACCESSORIES = BASE_ACCESSORIES + CLUB_ACCESSORIES + EARNED_ITEMS + LEGACY_ACCESSORIES
MAX_COMBINED = 3
FORMS = ("base", "main")


def clean_accessory(value):
    """A single valid id stays as a string. A list (a combined look) keeps up to 3 valid ids in order with duplicates
    and "none" removed: one id left becomes a plain string, none left becomes "none". Anything else is "none"."""
    if isinstance(value, str):
        return value if value in ACCESSORIES else "none"
    if isinstance(value, (list, tuple)):
        ids = list(dict.fromkeys(v for v in value if isinstance(v, str) and v in ACCESSORIES and v != "none"))
        ids = ids[:MAX_COMBINED]
        return ids if len(ids) > 1 else (ids[0] if ids else "none")
    return "none"


def clean_form(value) -> str:
    return value if value in FORMS else "base"
