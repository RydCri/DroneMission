import os
import uuid
from datetime import datetime, timezone
from flask import send_from_directory, request, current_app, abort
from flask import Blueprint, jsonify, session
from flask_login import login_required, current_user
from ..models import Flight, User, Pin
from ..extensions import db

main = Blueprint('main', __name__)


@login_required
@main.route('/flights/user', methods=['GET'])
def get_user_flights():
    user = current_user
    if not user or not user.is_authenticated:
        return jsonify({'error': 'Unauthorized'}), 401

    user_flights = [
        {
            'id': flight.id,
            'title': flight.title,
            'user_id': flight.user_id,
            'glbPath': f"/uploads/user_{user.id}/models/{os.path.basename(flight.glb_path)}",
            'scanPath': f"/uploads/user_{user.id}/scans/{os.path.basename(flight.scan_path)}",
            'uploadedAt': flight.uploaded_at.isoformat() if flight.uploaded_at else None
        }
        for flight in user.flights
    ]

    return jsonify({'flights': user_flights}), 200


@main.route('/flights/upload', methods=['POST'])
def upload_flight():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    title = request.form.get('title')
    model = request.files.get('model')
    scan = request.files.get('scan')

    if not title or not model or not scan:
        return jsonify({'error': 'Missing required fields'}), 400

    upload_root = current_app.config['UPLOAD_FOLDER']
    user_folder = os.path.join(upload_root, str(f'user_{user_id}'))
    scans_folder = os.path.join(user_folder, 'scans')
    models_folder = os.path.join(user_folder, 'models')
    os.makedirs(scans_folder, exist_ok=True)
    os.makedirs(models_folder, exist_ok=True)

    # Generate UUID filenames
    model_uuid = f"{uuid.uuid4()}.glb"
    scan_uuid = f"{uuid.uuid4()}.png"

    # Save files
    model_path = os.path.join(models_folder, model_uuid)
    scan_path = os.path.join(scans_folder, scan_uuid)
    model.save(model_path)
    scan.save(scan_path)

    timestamp = datetime.now(timezone.utc)

    # Store relative URLs for serving
    rel_model_path = f"/uploads/user_{user_id}/models/{model_uuid}"
    rel_scan_path = f"/uploads/user_{user_id}/scans/{scan_uuid}"

    new_flight = Flight(
        user_id=user_id,
        title=title,
        glb_path=rel_model_path,
        scan_path=rel_scan_path,
        original_model_name=model.filename,
        original_scan_name=scan.filename,
        mime_model=model.mimetype,
        mime_scan=scan.mimetype,
        uploaded_at=timestamp
    )
    db.session.add(new_flight)
    db.session.commit()

    return jsonify({'message': 'Upload successful'})


# Downloadable link serve
@main.route('/flights/<file_type>/<int:flight_id>', methods=['GET'])
def serve_user_file(file_type, flight_id):
    if 'user_id' not in session:
        return abort(401)

    user_id = session['user_id']
    flight = Flight.query.get_or_404(flight_id)

    if flight.user_id != user_id:
        return abort(403)

    # Determine path based on file type
    if file_type == 'model':
        filepath = flight.glb_path
        # TODO: extension, filepath, size restriction
        # if not flight.glb_path.endswith('.glb') and file_type == 'model':
        #     abort(403)

    elif file_type == 'scan':
        filepath = flight.scan_path
    else:
        return abort(400)

    # Convert relative path back to actual location
    full_path = os.path.join(current_app.root_path, filepath.lstrip('/'))

    directory = os.path.dirname(full_path)
    filename = os.path.basename(full_path)

    return send_from_directory(directory, filename)


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


@main.route('/flights/explore', methods=['GET'])
def explore_flights():
    page = request.args.get('page', 1, type=int)
    per_page = 50
    query = request.args.get('query', '', type=str).strip().lower()
    tag_filter = request.args.get('tag', '', type=str).strip().lower()

    flights_query = db.session.query(Flight).join(User)

    # Join tags in a separate table
    if query:
        flights_query = flights_query.filter(
            db.or_(
                db.func.lower(Flight.title).like(f'%{query}%'),
                db.func.lower(User.username).like(f'%{query}%'),
                db.func.lower(Pin.title).like(f'%{query}%')
            )
        )

    if tag_filter:
        # Comma-separated string field for Tags
        flights_query = flights_query.filter(
            db.func.lower(Flight.tags).like(f'%{tag_filter}%')
        )

    flights_query = flights_query.order_by(Flight.uploaded_at.desc())

    pagination = flights_query.paginate(page=page, per_page=per_page, error_out=False)

    flights = [
        {
            'id': f.id,
            'title': f.title,
            'username': f.user.username,
            'glbPath': f"/uploads/user_{f.user_id}/models/{os.path.basename(f.glb_path)}",
            'scanPath': f"/uploads/user_{f.user_id}/scans/{os.path.basename(f.scan_path)}",
            'uploadedAt': f.uploaded_at.isoformat() if f.uploaded_at else None,
            'tags': f.tags.split(',') if f.tags else []
        }
        for f in pagination.items
    ]

    return jsonify({
        'flights': flights,
        'totalPages': pagination.pages,
        'currentPage': page
    })



# Download link for .glb
@main.route('/download/<path:filename>')
@login_required
def secure_download(filename):
    user_id = session.get('user_id')
    safe_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"user_{user_id}")
    return send_from_directory(safe_path, filename, as_attachment=True)


