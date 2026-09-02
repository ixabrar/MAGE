import os
try:
    from groq import Groq
except ImportError:
    Groq = None

def generate_health_recommendations(factors: list) -> str:
    """
    Generates personalized health recommendations using Groq
    based on SHAP contributing factors.

    Returns recommendations formatted as HTML.
    """

    if Groq is None:
        print("[LLM ERROR]: groq not installed, using fallback.")
        return "<p><em>AI recommendations temporarily unavailable.</em></p>"

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        print("[LLM ERROR]: GROQ_API_KEY environment variable is not set.")
        return (
            "<p><em>Warning: Groq API key is missing. "
            "Cannot generate AI recommendations.</em></p>"
        )

    if not factors:
        return ""

    # Format SHAP factors
    factor_lines = []

    for f in factors:
        name = f.get("feature", "Unknown")
        val = f.get("value", 0)
        impact = f.get("impact", 0)

        factor_lines.append(
            f"- {name}: Value = {val:.2f} "
            f"(Added {impact:.2f} years to biological age)"
        )

    factors_text = "\n".join(factor_lines)

    prompt = f"""
You are an expert health recommendation assistant.

A patient has completed a blood and health checkup.
A machine learning model has estimated that the patient's
biological age is higher than their chronological age.

The top factors contributing to the increased biological age are:

{factors_text}

Provide 3 to 4 very concise, actionable, practical health
recommendations related specifically to these biomarkers.

Important:
- Do not diagnose diseases.
- Do not prescribe medications.
- Do not make extreme or unsafe recommendations.
- Encourage consultation with a qualified healthcare professional
  when appropriate.
- Do not invent patient information.
- Base recommendations only on the provided factors.
- Keep recommendations easy for a patient to understand.

Format the output EXCLUSIVELY as clean HTML.
Do not use Markdown.
Do not use ```html.
Use simple HTML tags such as <ul>, <li>, and <strong>.
Do not include <h1> or <h2>.
Start directly with the recommendations.

Keep the tone professional, concise, and encouraging.
"""

    try:
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
          model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You provide concise, safe, evidence-based "
                        "health recommendations. You do not diagnose "
                        "conditions or prescribe medication."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            max_completion_tokens=500
        )

        html_content = response.choices[0].message.content

        if not html_content:
            return "<p><em>No recommendations generated.</em></p>"

        html_content = html_content.strip()

        # Remove accidental markdown code fences
        if html_content.startswith("```html"):
            html_content = html_content[7:]

        elif html_content.startswith("```"):
            html_content = html_content[3:]

        if html_content.endswith("```"):
            html_content = html_content[:-3]

        return html_content.strip()

    except Exception as e:
        print(f"[LLM ERROR] Exception during Groq API call: {e}")

        return (
            "<p><em>"
            "Error generating recommendations at this time."
            "</em></p>"
        )
