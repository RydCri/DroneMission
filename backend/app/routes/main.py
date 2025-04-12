import os
from flask import send_from_directory, request
from werkzeug.utils import secure_filename
from flask import Blueprint, jsonify, session
from ..models import Flight, User
from ..extensions import db

main = Blueprint('main', __name__)


@main.route('/flights/user', methods=['GET'])
def get_user_flights():
    user_id = session.get('user_id')
    print("Session ID: ", user_id)
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_flights = [
        {
            'id': flight.id,
            'title': flight.title,
            'glbPath': flight.glb_path,
            'ndviPath': flight.ndvi_path
        } for flight in user.flights
    ]

    return jsonify({'flights': user_flights}), 200


@main.route('/upload', methods=['POST'])
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

