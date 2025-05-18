from flask import Blueprint, request, session, jsonify
from flask_login import login_user, logout_user, login_required, current_user, LoginManager
from ..models import User, Notification
from ..extensions import db

auth = Blueprint('auth', __name__)


@auth.route('/test', methods=['POST'])
def auth_test():
    return jsonify({'message': 'Test successful'}), 201


@auth.route('/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already taken'}), 400

    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'Signup successful'}), 201


@auth.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        login_user(user)
        return jsonify({"message": "Logged in successfully"}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401


@auth.route('/session')
def session_status():
    if not current_user:
        return
    if current_user.is_authenticated:
        return jsonify({'username': current_user.username, 'user_id': current_user.id})
    return jsonify({'message': 'Not logged in'}), 401


@auth.route('/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})


@auth.route("/profile")
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


@auth.route('/notifications', methods=['POST'])
@login_required
def get_notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
    return jsonify([
        {
            'id': n.id,
            'message': n.message,
            'link': n.link,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat()
        }
        for n in notifs
    ])


@auth.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    notif = Notification.query.get_or_404(notification_id)
    if notif.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True})