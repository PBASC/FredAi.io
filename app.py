import requests
from flask import Flask, render_template, jsonify, request
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)

# Load environment variables
# This loads from a .env file locally. On Render, variables are set in the dashboard.
load_dotenv()

# Initialize CORS for your app
# IMPORTANT: Temporarily allowing all origins (*) for debugging purposes.
# In production, consider explicitly listing all valid Shopify domains (e.g., "https://yourcustomdomain.com", "https://impactventurescologne.myshopify.com").
CORS(app, resources={r"/*": {"origins": "*"}})


# Corrected: Using the *name* of the environment variable to retrieve its value
app.secret_key = os.getenv("SECRET_KEY") #

# SMTP Email Configurations (For Gmail)
# Corrected: Using the *name* of the environment variable to retrieve its value
EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS") #
# Corrected: Using the *name* of the environment variable to retrieve its value
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD") #

# The email address to send suggestions to
TO_EMAIL = "professionalbusinessadvisory@gmail.com"

# Gemini API configuration
# IMPORTANT: The API key should be provided via environment variables in production.
# For local development, you might set it directly or via a .env file.
# Corrected: Using the *name* of the environment variable to retrieve its value
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") #
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/submit_suggestion', methods=['POST'])
def submit_suggestion():
    data = request.get_json()  # Get the JSON data sent from the frontend
    suggestion = data.get('suggestion', '').strip()  # Get the suggestion text

    # Log the suggestion for debugging
    print(f"Received suggestion: {suggestion}")



    try:
        # Send the suggestion via email
        send_email(suggestion)
        return jsonify({'success': True, 'message': 'Thank you! Your suggestion has been sent.'}), 200
    except Exception as e:
        # Catch any error during email sending
        print(f"Error in submitting suggestion: {str(e)}")  # Log error on the server
        return jsonify({'success': False, 'message': f'Failed to send the suggestion: {str(e)}'}), 500


def send_email(suggestion):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_ADDRESS
        msg['To'] = TO_EMAIL
        msg['Subject'] = 'New Service Suggestion for PBASC'

        # Crafting the email body with better formatting (HTML format)
        body = f"""
        <html>
        <body>
            <h2 style="color: #014B7B;">New Service Suggestion</h2>
            <p style="font-size: 16px;">A new suggestion has been submitted via the PBASC chatbot:</p>
            <p style="font-size: 16px; color: #4CAF50;">"{suggestion}"</p>
            <p style="font-size: 16px;">Please review the suggestion and take action accordingly.</p>
            <br>
            <footer>
                <p style="font-size: 14px; color: #777;">This is an automated email from PBASC. If you did not expect this email, please ignore it.</p>
            </footer>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))  # Attach the body as HTML

        # Connect to Gmail's SMTP server and send the email
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()  # Secure the connection
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            text = msg.as_string()
            server.sendmail(EMAIL_ADDRESS, TO_EMAIL, text)

        print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise e  # Raise the exception to be caught in the route


@app.route('/chat_gemini', methods=['POST'])
def chat_gemini():
    """
    Handles open-ended questions from the chatbot frontend and sends them to the Gemini API.
    """
    user_message = request.json.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": user_message}]
                }
            ]
        }
        headers = {
            'Content-Type': 'application/json'
        }
        # Append API key to URL if it's provided, otherwise Canvas will inject it
        api_url_with_key = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}" if GEMINI_API_KEY else GEMINI_API_URL

        response = requests.post(api_url_with_key, headers=headers, json=payload)
        response.raise_for_status() # Raise an exception for HTTP errors (4xx or 5xx)
        gemini_response = response.json()

        # Extract the text from the Gemini API response
        if gemini_response and gemini_response.get('candidates'):
            first_candidate = gemini_response['candidates'][0]
            if first_candidate.get('content') and first_candidate['content'].get('parts'):
                first_part = first_candidate['content']['parts'][0]
                if first_part.get('text'):
                    return jsonify({'response': first_part['text']})

        return jsonify({'error': 'Could not get a valid response from Gemini API', 'details': gemini_response}), 500

    except requests.exceptions.RequestException as e:
        print(f"Request to Gemini API failed: {e}")
        return jsonify({'error': 'Failed to connect to AI service', 'details': str(e)}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({'error': 'An unexpected error occurred', 'details': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)ue)

