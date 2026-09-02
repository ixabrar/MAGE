import os
import google.generativeai as genai

# Configure the API key when the module loads
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def generate_health_recommendations(factors: list) -> str:
    """
    Calls the Gemini API to generate personalized health recommendations based on SHAP contributing factors.
    Returns the recommendations formatted as HTML.
    """
    if not api_key:
        return "<p><em>Warning: Gemini API key is missing. Cannot generate AI recommendations.</em></p>"
        
    if not factors:
        return ""
        
    # Format the factors for the prompt
    factor_lines = []
    for f in factors:
        name = f.get("feature", "Unknown")
        val = f.get("value", 0)
        impact = f.get("impact", 0)
        factor_lines.append(f"- {name}: Value = {val:.2f} (Added {impact:.2f} years to biological age)")
        
    factors_text = "\n".join(factor_lines)
    
    prompt = f"""
You are an expert medical AI assistant. The patient has taken a blood and health checkup. 
A machine learning model has determined that their biological age is higher than their chronological age.
The top factors driving this increase are:

{factors_text}

Provide 3 to 4 very concise, actionable, and practical health recommendations to help the patient improve these specific biomarkers.
Format your output EXCLUSIVELY in clean HTML without any markdown code blocks (do not use ```html). 
Use simple HTML tags like <ul>, <li>, and <strong>. 
Do not include any headers like <h1> or <h2>. Just jump straight into the bullet points or paragraphs.
Keep the tone professional and encouraging.
"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        # Strip potential markdown formatting if the model still returns it
        html_content = response.text.strip()
        if html_content.startswith("```html"):
            html_content = html_content[7:]
        if html_content.startswith("```"):
            html_content = html_content[3:]
        if html_content.endswith("```"):
            html_content = html_content[:-3]
            
        return html_content.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return "<p><em>Error generating recommendations at this time.</em></p>"
