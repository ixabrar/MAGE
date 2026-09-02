from fastapi import APIRouter, UploadFile, File, HTTPException
import fitz
import re


router = APIRouter(
    prefix="/api/blood-report",
    tags=["Blood Report"]
)




TARGET_FEATURES = [
    "Age", "CRP", "LBDEONO", "LBDHDD", "LBDLYMNO", "LBDMONO", "LBDNENO",
    "LBXBAPCT", "LBXEOPCT", "LBXGH", "LBXHCT", "LBXHGB", "LBXLYPCT", "LBXMC",
    "LBXMCHSI", "LBXMCVSI", "LBXMOPCT", "LBXMPSI", "LBXNEPCT", "LBXPLTSI",
    "LBXRBCSI", "LBXRDW", "LBXSAL", "LBXSAPSI", "LBXSASSI", "LBXSATSI",
    "LBXSBU", "LBXSC3SI", "LBXSCA", "LBXSCH", "LBXSCLSI", "LBXSCR", "LBXSGB",
    "LBXSGL", "LBXSGTSI", "LBXSIR", "LBXSKSI", "LBXSLDSI", "LBXSNASI",
    "LBXSOSSI", "LBXSPH", "LBXSTB", "LBXSTP", "LBXSUA", "LBXTC", "LBXWBCSI",
    "URXCRS", "URXUCR", "URXUMA", "URXUMS", "URDACT", "LBXSCK", "Gender",
    "Weight", "Height", "Waist", "Systolic_BP", "Alcohol_days",
    "Exercise_days", "LBXGLU", "Smoking_status_Former", "Smoking_status_Never",
    "log_CRP", "log_LBXSAPSI", "log_LBXWBCSI", "log_LBXGH", "log_LBXSCR",
    "log_LBXGLU", "chol_ratio", "non_hdl", "scr_albumin_ratio",
    "inflam_score", "NLR_proxy", "glycation_gap", "LBXRDW_sq",
    "LBXMCVSI_sq", "BMI", "WHtR",
]



def convert_value(value):
    if value is None:
        return None

    value = str(value).strip()
    if not value:
        return None

    value = value.replace(",", "")
    value = value.replace("−", "-")

    try:
        number = float(value)
        if number.is_integer():
            return int(number)
        return number
    except ValueError:
        return value




def open_pdf(pdf_bytes: bytes):
    try:
        return fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to open PDF: {str(e)}"
        )



def extract_patient_information(text):
    result = {}

    # Example: "Age/Gender : 49 Years/Male"
    match = re.search(
        r"Age\s*/\s*Gender\s*[:\-]?\s*"
        r"(\d+)\s*Years?\s*/\s*([A-Za-z]+)",
        text,
        re.IGNORECASE
    )

    if match:
        result["Age"] = int(match.group(1))
        result["Gender"] = match.group(2)

    return result



UNIT_WHITELIST = {
    "g/dl", "mg/dl", "%", "fl", "pg", "u/l", "ng/dl", "µg/dl", "μg/dl",
    "µiu/ml", "μiu/ml", "miu/ml", "mmol/l", "meq/l", "10^9/l", "10^12/l",
    "10^3/ul", "10^6/ul", "cells/cumm", "iu/l", "mosm/kg", "sec",
    "mm/hr", "ratio",
}

NUMERIC_RE = re.compile(r"^[-+]?\d+(\.\d+)?$")
RANGE_RE = re.compile(r"^[<>]?\s*=?\s*\d|^\d+(\.\d+)?\s*-\s*\d+(\.\d+)?$")


STOP_PREFIXES = (
    "interpretation", "note:", "***", "result rechecked",
    "correlate clinically", "name", "sample id", "age/gender",
    "reg. no", "referred by", "spp code", "referring customer",
    "primary sample", "sample tested in", "client address",
    "collected on", "received on", "reported on", "report status",
    "lab address", "pregnancy & cord blood", "first trimester",
    "second&third trimester", "second trimester", "third trimester",
    "cord blood", "page ",
)


MAX_METHOD_LINES = 2


HEADER_WORDS = {
    "test name", "test name results units ref. range method",
    "results", "units", "ref. range", "method",
    "haematology", "clinical biochemistry", "morphology",
}


def is_unit(line):
    return line.strip().lower().rstrip(".") in UNIT_WHITELIST


def is_range_like(line):
    l = line.strip()
    if not l or len(l) > 30:
        return False
    return bool(RANGE_RE.match(l))


def looks_like_stop(line):
    l = line.strip().lower()
    return any(l.startswith(p) for p in STOP_PREFIXES)


def parse_page_text(text, page_number):
    """
    Walk a page's raw text line-by-line and reconstruct result rows
    by anchoring on numeric-only lines (the Value field), then
    classifying the lines immediately before/after each anchor.
    """
    lines = [l.strip() for l in text.split("\n")]
    n = len(lines)
    value_idxs = [i for i, l in enumerate(lines) if NUMERIC_RE.match(l)]

    rows = []
    prev_end = 0

    for pos, vi in enumerate(value_idxs):
        # --- NAME: nearest non-empty line before the value ---
        j = vi - 1
        while j >= prev_end and not lines[j]:
            j -= 1

        if j < prev_end:
            continue  # stray number with no preceding label -> skip

        name = lines[j].strip()

        if (
            not name
            or looks_like_stop(name)
            or NUMERIC_RE.match(name)
            or name.lower() in HEADER_WORDS
        ):
            continue

        value = lines[vi]

        # --- bound the trailing window by the next value anchor ---
        next_vi = value_idxs[pos + 1] if pos + 1 < len(value_idxs) else min(vi + 6, n)
        trailing = [l for l in lines[vi + 1:next_vi] if l.strip()]

        unit = None
        ref_range = None
        method_parts = []

        idx = 0
        if idx < len(trailing) and is_unit(trailing[idx]):
            unit = trailing[idx]
            idx += 1

        if idx < len(trailing) and is_range_like(trailing[idx]):
            ref_range = trailing[idx]
            idx += 1

        remaining = trailing[idx:]

        if remaining and pos + 1 < len(value_idxs):
            remaining = remaining[:-1]

        for r in remaining:
            if looks_like_stop(r) or len(method_parts) >= MAX_METHOD_LINES:
                break
            method_parts.append(r)

        method = " ".join(method_parts).strip() or None

        rows.append({
            "test_name": name,
            "value": convert_value(value),
            "unit": unit,
            "reference_range": ref_range,
            "method": method,
            "page": page_number,
        })
        prev_end = vi + 1

    return rows


def extract_report_rows(document):
    all_rows = []
    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text")
        all_rows.extend(parse_page_text(text, page_number))
    return all_rows


def extract_raw_text(document):
    pages = []
    for page_number, page in enumerate(document, start=1):
        text = page.get_text("text")
        pages.append(f"--- PAGE {page_number} ---\n{text}")
    return "\n\n".join(pages)




def normalize_test_name(name):
    name = str(name).replace("\n", " ")
    name = re.sub(r"\s+", " ", name)
    return name.strip()



MODEL_MAPPING = {
    "Haemoglobin": "LBXHGB",
    "Hemoglobin": "LBXHGB",
    "Haemoglobin (Hb)": "LBXHGB",
    "Hemoglobin (Hb)": "LBXHGB",

    "RBC Count": "LBXRBCSI",
    "RBC": "LBXRBCSI",

    "Haematocrit": "LBXHCT",
    "Haematocrit (HCT)": "LBXHCT",
    "Hematocrit": "LBXHCT",
    "Hematocrit (HCT)": "LBXHCT",

    "MCV": "LBXMCVSI",
    "MCH": "LBXMCHSI",
    "MCHC": "LBXMC",

    "RDW-CV": "LBXRDW",
    "RDW": "LBXRDW",

    "Platelet Count": "LBXPLTSI",
    "Platelet Count (PLT)": "LBXPLTSI",
    "Platelets": "LBXPLTSI",

    "Total WBC Count": "LBXWBCSI",
    "WBC Count": "LBXWBCSI",
    "Total WBC": "LBXWBCSI",

    "Neutrophils": "LBXNEPCT",
    "Lymphocytes": "LBXLYPCT",
    "Monocytes": "LBXMOPCT",
    "Eosinophils": "LBXEOPCT",
    "Basophils": "LBXBAPCT",

    "Absolute Neutrophils Count": "LBDNENO",
    "Absolute Neutrophil Count": "LBDNENO",

    "Absolute Lymphocyte Count": "LBDLYMNO",
    "Absolute Lymphocytes Count": "LBDLYMNO",

    "Absolute Monocyte Count": "LBDMONO",
    "Absolute Monocytes Count": "LBDMONO",

    "Absolute Eosinophils Count": "LBDEONO",
    "Absolute Eosinophil Count": "LBDEONO",

    "Uric Acid": "LBXSUA",

    "Blood Urea Nitrogen (BUN)": "LBXSBU",
    "BUN": "LBXSBU",

    "Creatinine -Serum": "LBXSCR",
    "Creatinine": "LBXSCR",
    "Creatinine-Serum": "LBXSCR",

    "Calcium": "LBXSCA",

    "Glycated Hemoglobin (HbA1c)": "LBXGH",
    "Glycated Hemoglobin": "LBXGH",
    "HbA1c": "LBXGH",

    "Albumin": "LBXSAL",
    "Globulin": "LBXSGB",

    "Alkaline Phosphatase(ALP)": "LBXSAPSI",
    "Alkaline Phosphatase (ALP)": "LBXSAPSI",
    "Alkaline Phosphatase": "LBXSAPSI",
    "ALP": "LBXSAPSI",

    "Aspartate Aminotransferase (AST/SGOT)": "LBXSASSI",
    "AST": "LBXSASSI",
    "SGOT": "LBXSASSI",

    "Alanine Aminotransferase (ALT/SGPT)": "LBXSATSI",
    "ALT": "LBXSATSI",
    "SGPT": "LBXSATSI",

    "Gamma Glutamyl Transpeptidase (GGTP)": "LBXSGTSI",
    "GGTP": "LBXSGTSI",

    "Bilirubin(Total)": "LBXSTB",
    "Bilirubin (Total)": "LBXSTB",
    "Total Bilirubin": "LBXSTB",

    "Protein - Total": "LBXSTP",
    "Total Protein": "LBXSTP",

    "Iron(Fe)": "LBXSIR",
    "Iron (Fe)": "LBXSIR",
    "Iron": "LBXSIR",

    "Cholesterol-HDL": "LBDHDD",
    "HDL": "LBDHDD",

    "Cholesterol Total": "LBXTC",
    "Total Cholesterol": "LBXTC",
}


try:
    from rapidfuzz import process, fuzz
    _FUZZY_AVAILABLE = True
except ImportError:
    _FUZZY_AVAILABLE = False

FUZZY_MATCH_THRESHOLD = 90  


def get_model_feature(test_name):
    normalized = normalize_test_name(test_name)

    if normalized in MODEL_MAPPING:
        return MODEL_MAPPING[normalized]

    for name, feature in MODEL_MAPPING.items():
        if normalized.lower() == name.lower():
            return feature

    if _FUZZY_AVAILABLE and normalized:
        match = process.extractOne(
            normalized,
            MODEL_MAPPING.keys(),
            scorer=fuzz.token_sort_ratio,
            score_cutoff=FUZZY_MATCH_THRESHOLD,
        )
        if match:
            matched_name, score, _ = match
            return MODEL_MAPPING[matched_name]

    return None



def build_all_report_values(patient_information, parsed_rows):
    result = {}
    result.update(patient_information)

    for row in parsed_rows:
        test_name = normalize_test_name(row["test_name"])
        if not test_name:
            continue

        entry = {
            "value": row["value"],
            "unit": row["unit"],
            "reference_range": row["reference_range"],
            "method": row["method"],
            "page": row["page"],
        }

        if test_name not in result:
            result[test_name] = entry
        else:
            existing = result[test_name]
            if isinstance(existing, list):
                existing.append(entry)
            else:
                result[test_name] = [existing, entry]

    return result


def build_model_features(patient_information, parsed_rows):
    features = {feature: None for feature in TARGET_FEATURES}

    if "Age" in patient_information:
        features["Age"] = patient_information["Age"]

    if "Gender" in patient_information:
        features["Gender"] = patient_information["Gender"]

    for row in parsed_rows:
        feature = get_model_feature(row["test_name"])

        if not feature or feature not in features:
            continue

        # Don't overwrite the first valid value found
        if features[feature] is None and row["value"] is not None:
            features[feature] = row["value"]

    return features



import math


def _safe_log(x):
    """Natural log; guards against None/zero/negative inputs."""
    try:
        if x is None:
            return None
        x = float(x)
        if x <= 0:
            return None
        return math.log(x)
    except (TypeError, ValueError):
        return None


def _safe_div(a, b):
    try:
        if a is None or b is None:
            return None
        b = float(b)
        if b == 0:
            return None
        return float(a) / b
    except (TypeError, ValueError):
        return None


def compute_derived_features(features):
    """
    Fill in derived features on top of build_model_features() output.
    Only computes a derived value when every input it depends on is
    already present and non-None; otherwise leaves it as None so it
    still shows up correctly in missing_model_features.
    """
    f = dict(features)  # don't mutate caller's dict

    # --- log transforms ---
    f["log_CRP"] = _safe_log(f.get("CRP"))
    f["log_LBXSAPSI"] = _safe_log(f.get("LBXSAPSI"))
    f["log_LBXWBCSI"] = _safe_log(f.get("LBXWBCSI"))
    f["log_LBXGH"] = _safe_log(f.get("LBXGH"))
    f["log_LBXSCR"] = _safe_log(f.get("LBXSCR"))
    f["log_LBXGLU"] = _safe_log(f.get("LBXGLU"))

    # --- squares ---
    if f.get("LBXRDW") is not None:
        f["LBXRDW_sq"] = float(f["LBXRDW"]) ** 2
    if f.get("LBXMCVSI") is not None:
        f["LBXMCVSI_sq"] = float(f["LBXMCVSI"]) ** 2


    f["chol_ratio"] = _safe_div(f.get("LBXTC"), f.get("LBDHDD"))

    if f.get("LBXTC") is not None and f.get("LBDHDD") is not None:
        f["non_hdl"] = float(f["LBXTC"]) - float(f["LBDHDD"])


    f["scr_albumin_ratio"] = _safe_div(f.get("LBXSCR"), f.get("LBXSAL"))

    f["NLR_proxy"] = _safe_div(f.get("LBXNEPCT"), f.get("LBXLYPCT"))


    if f.get("log_CRP") is not None and f.get("log_LBXWBCSI") is not None:
        f["inflam_score"] = f["log_CRP"] + f["log_LBXWBCSI"]


    if f.get("LBXGH") is not None and f.get("LBXGLU") is not None:
        est_hba1c = (float(f["LBXGLU"]) + 46.7) / 28.7
        f["glycation_gap"] = float(f["LBXGH"]) - est_hba1c

    
    if f.get("Weight") is not None and f.get("Height") is not None:
        try:
            height_m = float(f["Height"]) / 100.0  
            f["BMI"] = float(f["Weight"]) / (height_m ** 2)
        except (TypeError, ValueError, ZeroDivisionError):
            pass

    if f.get("Waist") is not None and f.get("Height") is not None:
        f["WHtR"] = _safe_div(f.get("Waist"), f.get("Height"))

    return f


@router.post("/parse")
async def parse_blood_report(file: UploadFile = File(...)):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported"
        )

    pdf_bytes = await file.read()

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF is empty"
        )

    document = open_pdf(pdf_bytes)

    try:
        raw_text = extract_raw_text(document)

        if not raw_text.strip():
            raise HTTPException(
                status_code=400,
                detail="PDF contains no readable text"
            )

        patient_information = extract_patient_information(raw_text)

        parsed_rows = extract_report_rows(document)

        all_report_values = build_all_report_values(
            patient_information, parsed_rows
        )

        model_features = build_model_features(
            patient_information, parsed_rows
        )
        model_features = compute_derived_features(model_features)

        extracted_model_features = {
            key: value
            for key, value in model_features.items()
            if value is not None
        }

        missing_model_features = [
            key
            for key, value in model_features.items()
            if value is None
        ]

        return {
            "status": "success",
            "file_name": file.filename,
            "extraction_method": "PyMuPDF text-stream parsing (unit-anchored)",
            "total_report_values_extracted": len(parsed_rows),
            "total_model_features": len(TARGET_FEATURES),
            "extracted_model_features_count": len(extracted_model_features),
            "missing_model_features_count": len(missing_model_features),
            "patient": patient_information,
            "extracted_model_features": extracted_model_features,
            "missing_model_features": missing_model_features,
            "all_report_values": all_report_values,
            "raw_extracted_rows": parsed_rows,
        }

    finally:
        document.close()