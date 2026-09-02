import os
import smtplib
from email.message import EmailMessage
from datetime import datetime

def send_report_email(patient_email: str, patient_name: str, pdf_path: str):
    """
    Sends the generated PDF report to the patient's email using Gmail SMTP.
    Requires SMTP_EMAIL and SMTP_PASSWORD to be set in .env.
    """
    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    if not smtp_email or not smtp_password:
        raise ValueError("SMTP_EMAIL or SMTP_PASSWORD not configured in .env")
        
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found at {pdf_path}")

    msg = EmailMessage()
    msg['Subject'] = f"Your Biological Age Analysis Report - MAGE Diagnostics"
    msg['From'] = f"MAGE Diagnostics <{smtp_email}>"
    msg['To'] = patient_email
    
    current_date = datetime.now().strftime("%B %d, %Y")
    
    body = f"""Dear {patient_name},

Thank you for choosing MAGE Diagnostics.

Attached is your Biological Age Analysis Report generated on {current_date}. 
This report details your chronological age versus your biological age and highlights the key biomarkers contributing to your health profile.

If you have any questions, please contact your doctor.

Best regards,
MAGE Healthcare AI
"""
    msg.set_content(body)
    
    # Read the PDF and attach it
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()
        
    # maintype='application', subtype='pdf'
    msg.add_attachment(
        pdf_data, 
        maintype='application', 
        subtype='pdf', 
        filename=os.path.basename(pdf_path)
    )
    
    # Send via Gmail SMTP
    try:
        # Use port 465 for implicit SSL/TLS
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(smtp_email, smtp_password)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email to {patient_email}: {e}")
        raise
