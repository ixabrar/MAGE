import os
from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML
from datetime import datetime

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
    
    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
