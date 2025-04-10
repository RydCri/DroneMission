# backend/app.py
import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route('/data', methods=['GET'])
def get_data():
    data = {
        "message": "Hello from Flask!",
        "status": "success"
    }
    return jsonify(data)


@app.route('/api/missions', methods=['GET'])
def get_missions():
    # try:
    return send_from_directory(os.getcwd(), './static/missions.json')
    # except FileNotFoundError:
    #     return jsonify({'error': 'Data not found'}), 404


if __name__ == '__main__':
    app.run(debug=True)
