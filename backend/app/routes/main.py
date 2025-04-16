import os
from flask import send_from_directory, request, current_app
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, session
from ..models import Flight, User
from ..extensions import db

main = Blueprint('main', __name__)


@main.route('/flights/user', methods=['GET'])
def get_user_flights():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Flights retrieved from upload path
    user_flights = [
        {
            'id': flight.id,
            'title': flight.title,
            'glbPath': f"/uploads/user_{user_id}/models/{os.path.basename(flight.glb_path)}",
            'ndviPath': f"/uploads/user_{user_id}/scans/{os.path.basename(flight.ndvi_path)}"
        } for flight in user.flights
    ]

    return jsonify({'flights': user_flights}), 200


@main.route('/flights/upload', methods=['POST'])
def upload_flight():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    title = request.form.get('title')
    model = request.files.get('model')
    ndvi = request.files.get('ndvi')

    if not title or not model or not ndvi:
        return jsonify({'error': 'Missing required fields'}), 400

    model_filename = secure_filename(model.filename)
    ndvi_filename = secure_filename(ndvi.filename)

    # Construct user-specific directories
    user_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], f'user_{user_id}')
    model_dir = os.path.join(user_folder, 'models')
    ndvi_dir = os.path.join(user_folder, 'scans')

    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(ndvi_dir, exist_ok=True)

    model_path = os.path.join(model_dir, model_filename)
    ndvi_path = os.path.join(ndvi_dir, ndvi_filename)

    model.save(model_path)
    ndvi.save(ndvi_path)

    new_flight = Flight(
        user_id=user_id,
        title=title,
        glb_path=model_path,
        ndvi_path=ndvi_path
    )
    db.session.add(new_flight)
    db.session.commit()

    return jsonify({'message': 'Upload successful'})


@main.route('/flights/<int:flight_id>', methods=['PUT'])
def update_flight(flight_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json()
    new_title = data.get('title')

    flight = Flight.query.filter_by(id=flight_id, user_id=user_id).first()
    if not flight:
        return jsonify({'error': 'Flight not found'}), 404

    flight.title = new_title
    db.session.commit()
    return jsonify({'message': 'Flight updated successfully'})


@main.route('/flights/<int:flight_id>', methods=['DELETE'])
def delete_flight(flight_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    flight = Flight.query.filter_by(id=flight_id, user_id=user_id).first()
    if not flight:
        return jsonify({'error': 'Flight not found'}), 404

    db.session.delete(flight)
    db.session.commit()
    return jsonify({'message': 'Flight deleted successfully'})

@main.route('/data', methods=['GET'])
def get_data():
    data = {
        "message": "Hello from Flask!",
        "status": "success"
    }
    return jsonify(data)


@main.route('/mission', methods=['GET'])
def get_missions():
    return send_from_directory(os.getcwd(), './static/missions.json')

