from datetime import datetime, timezone
from flask import Blueprint, request, send_file, jsonify
import tempfile, os
from flask_login import current_user, login_required
from simplekml import Kml
import zipfile
from .. import db
from ..models import FlightKML, Flight

export = Blueprint('export', __name__)


@export.route('/export', methods=['POST'])
def export_wayline():
    data = request.json
    mission = data.get('mission')  # list of [lat, lon]
    format = data.get('format', 'kml')  # 'kml' or 'kmz'

    if not mission:
        return {"error": "No mission data provided"}, 400

    kml = Kml()
    linestring = kml.newlinestring(name="Drone Path")
    linestring.coords = mission
    linestring.extrude = 1
    linestring.altitudemode = "clampToGround"
    linestring.style.linestyle.color = "ff0000ff"  # red
    linestring.style.linestyle.width = 3

    with tempfile.TemporaryDirectory() as tmpdir:
        kml_path = os.path.join(tmpdir, "wayline.kml")
        kml.save(kml_path)

        if format == 'kmz':
            kmz_path = os.path.join(tmpdir, "wayline.kmz")
            with zipfile.ZipFile(kmz_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                zf.write(kml_path, arcname="doc.kml")
            return send_file(kmz_path, as_attachment=True)
        else:
            return send_file(kml_path, as_attachment=True)


@export.route('/save_flight_data', methods=['POST'])
@login_required
def save_flight_data():
    data = request.get_json()

    flight_id = data.get('flight_id')
    kml_content = data.get('kml_content')
    json_content = data.get('json_content')

    if not flight_id or not kml_content or not json_content:
        return jsonify({'error': 'Missing flight ID or content'}), 400

    # Auth check
    flight = Flight.query.filter_by(id=flight_id, user_id=current_user.id).first()
    if not flight:
        return jsonify({'error': 'Flight not found or unauthorized'}), 404

    # Overwrite existing or create new
    existing = FlightKML.query.filter_by(flight_id=flight.id).first()
    if existing:
        existing.kml_content = kml_content
        existing.json_content = json_content
        existing.created_at = datetime.now(timezone.utc)
    else:
        new_flight_data = FlightKML(
            flight_id=flight.id,
            kml_content=kml_content,
            json_content=json_content,
            created_at=datetime.now(timezone.utc)
        )
        db.session.add(new_flight_data)

    db.session.commit()
    return jsonify({'message': 'Flight data saved successfully'}), 200