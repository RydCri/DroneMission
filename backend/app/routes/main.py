import os
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from flask_cors import CORS


from flask import Blueprint, jsonify
from ..models import Flight
from ..extensions import db

main = Blueprint('main', __name__)

@main.route('/api/missions', methods=['GET'])
def get_missions():
    missions = Flight.query.all()
    return jsonify([
        {
            'title': flight.title,
            'glbPath': flight.glb_path,
            'ndviPath': flight.ndvi_path
        } for flight in missions
    ])

@main.route('/api/flights', methods=['GET'])
def get_flights():
    # Replace `1` with session user ID
    flights = Flight.query.filter_by(user_id=1).all()
    return jsonify([
        {
            "id": f.id,
            "title": f.title,
            "glbPath": f"/models/{os.path.basename(f.glb_path)}",
            "ndviPath": f"/scans/{os.path.basename(f.ndvi_path)}"
        } for f in flights
    ])

@main.route('/api/upload', methods=['POST'])
def upload_flight():
    from flask import current_app, request, session

    title = request.form['title']
    model_file = request.files['model']
    ndvi_file = request.files['ndvi']

    filename_model = secure_filename(model_file.filename)
    filename_ndvi = secure_filename(ndvi_file.filename)

    model_path = os.path.join(current_app.config['UPLOAD_FOLDER_MODELS'], filename_model)
    ndvi_path = os.path.join(current_app.config['UPLOAD_FOLDER_SCANS'], filename_ndvi)

    model_file.save(model_path)
    ndvi_file.save(ndvi_path)

    flight = Flight(
        title=title,
        glb_path=f'/models/{filename_model}',
        ndvi_path=f'/scans/{filename_ndvi}',
        user_id=session.get('user_id', 1)  # TODO: Replace with real user session
    )
    db.session.add(flight)
    db.session.commit()

    return jsonify({'message': 'Flight uploaded successfully'}), 201

@main.route('/api/flights/<int:flight_id>', methods=['PUT'])
def update_flight(flight_id):
    from flask import request, current_app, session

    flight = Flight.query.get_or_404(flight_id)

    if flight.user_id != session.get('user_id', 1):
        return jsonify({'error': 'Unauthorized'}), 403

    title = request.form.get('title')
    if title:
        flight.title = title

    if 'model' in request.files:
        model_file = request.files['model']
        filename_model = secure_filename(model_file.filename)
        model_path = os.path.join(current_app.config['UPLOAD_FOLDER_MODELS'], filename_model)
        model_file.save(model_path)
        flight.glb_path = f'/models/{filename_model}'

    if 'ndvi' in request.files:
        ndvi_file = request.files['ndvi']
        filename_ndvi = secure_filename(ndvi_file.filename)
        ndvi_path = os.path.join(current_app.config['UPLOAD_FOLDER_SCANS'], filename_ndvi)
        ndvi_file.save(ndvi_path)
        flight.ndvi_path = f'/scans/{filename_ndvi}'

    db.session.commit()
    return jsonify({'message': 'Flight updated'})


@main.route('/api/flights', methods=['GET'])
def get_user_flights():
    from flask import session

    user_id = session.get('user_id', 1)  # TODO: Replace with real login session
    flights = Flight.query.filter_by(user_id=user_id).all()

    return jsonify([
        {
            'id': f.id,
            'title': f.title,
            'glbPath': f.glb_path,
            'ndviPath': f.ndvi_path
        } for f in flights
    ])


@main.route('/data', methods=['GET'])
def get_data():
    data = {
        "message": "Hello from Flask!",
        "status": "success"
    }
    return jsonify(data)


@main.route('/api/mission', methods=['GET'])
def get_missions():
    return send_from_directory(os.getcwd(), './static/missions.json')

