import re
import decimal
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

try:
    import pytesseract
    HAS_PYTESSERACT = True
except ImportError:
    HAS_PYTESSERACT = False


def _convert_to_degrees(value):
    """
    Helper function to convert the GPS coordinates stored in EXIF to degrees in float/decimal format.
    value is a tuple of (degrees, minutes, seconds)
    """
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except Exception:
        return None


def extract_exif_gps(image_file):
    """
    Method 1: Extracts latitude and longitude from an image file using Pillow EXIF tags.
    Returns tuple: (latitude, longitude) as Decimal objects, or (None, None) if missing/invalid.
    """
    try:
        image_file.seek(0)
        image = Image.open(image_file)
        exif_data = image._getexif() if hasattr(image, '_getexif') else None

        if not exif_data:
            image_file.seek(0)
            return None, None

        gps_info = {}
        for tag, value in exif_data.items():
            decoded = TAGS.get(tag, tag)
            if decoded == 'GPSInfo':
                for t in value:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = value[t]

        if not gps_info:
            image_file.seek(0)
            return None, None

        lat_data = gps_info.get('GPSLatitude')
        lat_ref = gps_info.get('GPSLatitudeRef')
        lng_data = gps_info.get('GPSLongitude')
        lng_ref = gps_info.get('GPSLongitudeRef')

        if not lat_data or not lng_data or not lat_ref or not lng_ref:
            image_file.seek(0)
            return None, None

        lat = _convert_to_degrees(lat_data)
        lng = _convert_to_degrees(lng_data)

        if lat is None or lng is None:
            image_file.seek(0)
            return None, None

        if lat_ref != 'N':
            lat = -lat
        if lng_ref != 'E':
            lng = -lng

        image_file.seek(0)

        if -90 <= lat <= 90 and -180 <= lng <= 180:
            return (
                decimal.Decimal(str(round(lat, 7))),
                decimal.Decimal(str(round(lng, 7)))
            )
    except Exception as e:
        print(f"EXIF Extraction Error: {e}")
        try:
            image_file.seek(0)
        except Exception:
            pass

    return None, None


def extract_ocr_gps(image_file):
    """
    Method 2: Analyzes GPS Map Camera printed overlay on the image canvas using pytesseract / regex.
    Extracts printed Latitude, Longitude, and Address from the visual overlay.
    Returns tuple: (latitude, longitude, address) or (None, None, None) if missing/invalid.
    """
    if not HAS_PYTESSERACT:
        return None, None, None

    try:
        image_file.seek(0)
        image = Image.open(image_file)

        # Crop bottom 40% of the image where GPS Map Camera overlays are typically printed
        width, height = image.size
        bottom_box = (0, int(height * 0.5), width, height)
        cropped_image = image.crop(bottom_box)

        ocr_text = pytesseract.image_to_string(cropped_image)
        if not ocr_text or len(ocr_text.strip()) < 10:
            # Try full image if crop returned little text
            ocr_text = pytesseract.image_to_string(image)

        image_file.seek(0)

        if not ocr_text:
            return None, None, None

        # Regex patterns for GPS Map Camera format:
        # e.g., "Lat 19.076090°", "Latitude: 19.076090", "19.076090 N"
        lat_match = re.search(r'(?:Lat|Latitude)?[:\s]*(-?\d{1,2}\.\d{4,8})\s*°?\s*([NS])?', ocr_text, re.IGNORECASE)
        lng_match = re.search(r'(?:Long|Longitude|Lng)?[:\s]*(-?\d{1,3}\.\d{4,8})\s*°?\s*([EW])?', ocr_text, re.IGNORECASE)

        lat, lng = None, None

        if lat_match:
            val = float(lat_match.group(1))
            ref = lat_match.group(2)
            if ref and ref.upper() == 'S':
                val = -val
            if -90 <= val <= 90:
                lat = decimal.Decimal(str(round(val, 7)))

        if lng_match:
            val = float(lng_match.group(1))
            ref = lng_match.group(2)
            if ref and ref.upper() == 'W':
                val = -val
            if -180 <= val <= 180:
                lng = decimal.Decimal(str(round(val, 7)))

        # Extract address line if present
        address = None
        addr_match = re.search(r'(?:Address|Location)[:\s]*(.+)', ocr_text, re.IGNORECASE)
        if addr_match:
            address = addr_match.group(1).strip()

        if lat is not None and lng is not None:
            return lat, lng, address

    except Exception as e:
        print(f"OCR GPS Extraction Error: {e}")
        try:
            image_file.seek(0)
        except Exception:
            pass

    return None, None, None


def extract_gps_from_image(image_file):
    """
    Intelligent Dual-Mode Extractor:
    Step 1: Check EXIF metadata.
    Step 2: If EXIF is missing, fall back to OCR overlay extraction.
    Returns (latitude, longitude, address, method)
    """
    if not image_file:
        return None, None, None, None

    # Step 1: Try EXIF
    lat, lng = extract_exif_gps(image_file)
    if lat is not None and lng is not None:
        return lat, lng, None, "EXIF"

    # Step 2: Try OCR Overlay
    lat, lng, address = extract_ocr_gps(image_file)
    if lat is not None and lng is not None:
        return lat, lng, address, "OCR"

    return None, None, None, None
