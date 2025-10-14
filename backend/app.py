from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
# We now import both functions for our two features
from llm_integration import get_conditions_from_llm, generate_doctor_questions
from database import init_db, log_query

# --- SETUP ---
load_dotenv()
app = Flask(__name__)
CORS(app)
init_db()

# --- API ROUTE for Symptom Analysis ---
@app.route('/check_symptoms', methods=['POST'])
def check_symptoms():
    data = request.get_json()
    symptoms = data.get('symptoms', '')

    if not symptoms.strip() or len(symptoms) < 10:
        return jsonify({"error": "Please provide a more detailed description of your symptoms."}), 400

    llm_response = get_conditions_from_llm(symptoms)
    log_query(symptoms, llm_response)
    return jsonify({"response": llm_response})

# --- NEW API ROUTE for Generating Doctor Questions ---
@app.route('/prepare_questions', methods=['POST'])
def prepare_questions():
    data = request.get_json()
    symptoms = data.get('symptoms', '')
    analysis = data.get('analysis', '')

    if not symptoms or not analysis:
        return jsonify({"error": "Sufficient information not provided."}), 400

    llm_response = generate_doctor_questions(symptoms, analysis)
    # We can log this as a different type of query if desired
    log_query(f"Questions request for: {symptoms}", llm_response)
    return jsonify({"response": llm_response})

if __name__ == '__main__':
    app.run(debug=True, port=5000)

