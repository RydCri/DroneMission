from .extensions import db
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256') # MacOS OpenSSL conflict with scrypt

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    # One-to-many
    flights = db.relationship('Flight', backref='user', lazy=True)


class Flight(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(120))
    glb_path = db.Column(db.String(255))
    scan_path = db.Column(db.String(255))
    original_model_name = db.Column(db.String(255))
    original_scan_name = db.Column(db.String(255))
    mime_model = db.Column(db.String(64))
    mime_scan = db.Column(db.String(64))
    uploaded_at = db.Column(db.DateTime)