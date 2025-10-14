import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

def get_conditions_from_llm(symptoms):
    # UPDATED PROMPT: Added a new rule for the AI to check for nonsensical input.
    system_prompt = """You are a highly specialized medical information assistant. You must follow these rules strictly:
1.  First, evaluate the user's input. If it contains nonsensical words, gibberish, or is not a coherent description of medical symptoms, your ONLY response MUST be: "The provided symptoms are unclear. Please provide a clear and detailed description for an accurate analysis."
2.  If the input is a valid description of medical symptoms, you must analyze them and provide potential conditions.
3.  Your response for a valid analysis must strictly adhere to the following format, using Markdown, and MUST include all sections in the correct order:

**Probable Conditions:**
1.  **Condition Name:** [A brief, clear explanation.]
2.  **Condition Name:** [A brief, clear explanation.]

**Recommended Next Steps:**
* [A clear, actionable next step.]
* [Another clear, actionable next step.]

**Disclaimer:** This is for informational and educational purposes only and does not constitute medical advice. The information provided is not a substitute for professional medical consultation, diagnosis, or treatment. Always seek the advice of your physician or another qualified health provider."""

    user_prompt = f"Analyze the following symptoms: \"{symptoms}\""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error querying Groq for conditions: {e}")
        return "Error: Could not retrieve information at this time. Please try again later."

def generate_doctor_questions(symptoms, conditions_analysis):
    system_prompt = """You are a helpful medical assistant. Your task is to generate a list of 5-7 clear and concise questions that a patient can ask their doctor, organized into logical subsections. 
    
    CRITICAL INSTRUCTION: Your response MUST ONLY contain the questions and their subsections, followed by a disclaimer section. Do not add an introduction or conclusion.

    The format must be:

**About My Symptoms & Diagnosis**
* Question 1?
* Question 2?

**Treatment & Management**
* Question 3?
* Question 4?

**Prevention & Long-Term Outlook**
* Question 5?
* Question 6?

**Disclaimer:** These questions are suggestions for informational purposes only and are not a substitute for professional medical advice."""
    
    user_prompt = f"""Based on these symptoms and analysis, generate the questions in the specified format:
- My Symptoms: "{symptoms}"
- AI's Preliminary Analysis: "{conditions_analysis}"
"""

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            model="llama-3.1-8b-instant",
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error querying Groq for questions: {e}")
        return "Error: Could not generate questions at this time. Please try again later."

