from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from flask_cors import CORS
import os

from config import Config
from models import db, User, Flight
app = Flask(__name__)
CORS(app)
app.config.from_object(Config)

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)

os.makedirs(app.config['UPLOAD_FOLDER'] + '/glbs', exist_ok=True)
os.makedirs(app.config['UPLOAD_FOLDER'] + '/ndvis', exist_ok=True)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    user = User(email=data["email"], password_hash=hashed)
    db.session.add(user)
    db.session.commit()
    return jsonify(message="User created"), 201

@app.route("/api/profile")
@login_required
def profile():
    user_data = {
        "email": current_user.email,
        "flights": [{
            "title": f.title,
            "glbPath": f.glb_path,
            "ndviPath": f.ndvi_path
        } for f in current_user.flights]
    }
    return jsonify(user_data)


@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user and bcrypt.check_password_hash(user.password_hash, data["password"]):
        login_user(user)
        return jsonify(message="Logged in"), 200
    return jsonify(message="Invalid credentials"), 401

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return jsonify(message="Logged out"), 200

@app.route("/upload_flight", methods=["POST"])
@login_required
def upload_flight():
    title = request.form.get("title")
    glb = request.files["glb"]
    ndvi = request.files.get("ndvi")

    glb_filename = secure_filename(glb.filename)
    glb_path = os.path.join("uploads/glbs", glb_filename)
    glb.save(os.path.join(app.root_path, glb_path))

    ndvi_path = None
    if ndvi:
        ndvi_filename = secure_filename(ndvi.filename)
        ndvi_path = os.path.join("uploads/ndvis", ndvi_filename)
        ndvi.save(os.path.join(app.root_path, ndvi_path))

    flight = Flight(title=title, glb_path="/" + glb_path, ndvi_path="/" + ndvi_path if ndvi else None, owner=current_user)
    db.session.add(flight)
    db.session.commit()

    return jsonify(message="Flight uploaded"), 201

@app.route("/api/flights")
def list_flights():
    flights = Flight.query.all()
    data = [{
        "title": f.title,
        "glbPath": f.glb_path,
        "ndviPath": f.ndvi_path
    } for f in flights]
    return jsonify(data)

@app.route('/data', methods=['GET'])
def get_data():
    data = {
        "message": "Hello from Flask!",
        "status": "success"
    }
    return jsonify(data)


@app.route('/api/missions', methods=['GET'])
def get_missions():
    return send_from_directory(os.getcwd(), './static/missions.json')

if __name__ == '__main__':
    app.run(debug=True)
