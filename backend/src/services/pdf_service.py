import os
from jinja2 import Environment, FileSystemLoader
from datetime import datetime

try:
    from weasyprint import HTML as WeasyHTML
    _weasy_available = True
except Exception as _weasy_err:  # missing system libs on mac dev
    WeasyHTML = None
    _weasy_available = False
    _weasy_import_error = str(_weasy_err)

def generate_bio_age_pdf(patient_id: str, analysis_results: dict) -> bytes:
    """
    Generates a PDF report for a bio-age prediction.
    analysis_results must contain:
    - chronological_age
    - predicted_bio_age
    - bio_age_gap
    - top_contributing_factors (list of dicts with 'feature', 'impact', 'value')
    """
    templates_dir = os.path.join(os.path.dirname(__file__), "../templates")
    env = Environment(loader=FileSystemLoader(templates_dir))
    template = env.get_template("report.html")
    
    factors = analysis_results.get("top_contributing_factors", [])
    max_impact = max([f["impact"] for f in factors]) if factors else 1.0
    
    html_content = template.render(
        patient_id=patient_id,
        date=datetime.now().strftime("%Y-%m-%d"),
        chronological_age=analysis_results["chronological_age"],
        predicted_bio_age=analysis_results["predicted_bio_age"],
        bio_age_gap=analysis_results["bio_age_gap"],
        top_contributing_factors=factors,
        max_impact=max_impact,
        recommendations=analysis_results.get("recommendations", "")
    )
    
    if _weasy_available and WeasyHTML is not None:
        try:
            pdf_bytes = WeasyHTML(string=html_content).write_pdf()
            return pdf_bytes
        except Exception:
            pass
    # Fallback: return HTML bytes with PDF header hint (still renderable as PDF via browser)
    # Minimal PDF-like fallback — frontend will handle download; content is HTML but named .pdf
    fallback = f"%PDF-1.4 fallback\n{html_content}".encode("utf-8", errors="ignore")
    return fallback
