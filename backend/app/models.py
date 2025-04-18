from datetime import datetime, timezone

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


class Pin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    user = db.relationship('User', backref='pins')
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    glb_path = db.Column(db.String(255))  # Featured 3D model
    images = db.relationship('PinImage', backref='pin', lazy=True, cascade="all, delete-orphan")
    tags = db.relationship('Tag', secondary='pin_tags', back_populates='pins')
    comments = db.relationship('Comment', backref='pin', lazy=True, cascade="all, delete-orphan")
    likes = db.relationship('Like', backref='pin', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'created_at': self.created_at.isoformat(),
            'glbPath': self.glb_path,
            'images': [img.image_path for img in self.images],
            'tags': [tag.name for tag in self.tags],
            'username': self.user.username,
            'likes': len(self.likes),
            'comments': [comment.to_dict() for comment in self.comments]
        }


class PinImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=False)
    pin_id = db.Column(db.Integer, db.ForeignKey('pin.id'), nullable=False)


class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)
    pins = db.relationship('Pin', secondary='pin_tags', back_populates='tags')


pin_tags = db.Table('pin_tags',
                    db.Column('pin_id', db.Integer, db.ForeignKey('pin.id'), primary_key=True),
                    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
                    )


class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    pin_id = db.Column(db.Integer, db.ForeignKey('pin.id'))
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))


class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    pin_id = db.Column(db.Integer, db.ForeignKey('pin.id'))