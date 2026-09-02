import os
from google import genai

def generate_health_recommendations(factors: list) -> str:
    """
    Calls the Gemini API to generate personalized health recommendations based on SHAP contributing factors.
    Returns the recommendations formatted as HTML.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("[LLM ERROR]: GEMINI_API_KEY environment variable is not set.")
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
        client = genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        
        html_content = response.text.strip()
        
        if html_content.startswith("```html"):
            html_content = html_content[7:]
        if html_content.startswith("```"):
            html_content = html_content[3:]
        if html_content.endswith("```"):
            html_content = html_content[:-3]
            
        return html_content.strip()

    except Exception as e:
        print(f"[LLM ERROR] Exception during Gemini API call: {e}")
        return "<p><em>Error generating recommendations at this time.</em></p>"