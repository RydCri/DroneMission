import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from flask_migrate import Migrate

from .extensions import db
from .models import User
from .routes import register_routes
from .routes.auth import auth as auth_blueprint
from .routes.main import main as main_blueprint
from .routes.pins import pins as pins_blueprint
from .routes.export import export as export_blueprint

def create_app():
    app = Flask(__name__)
    # Config
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flights.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config.from_object('config.Config')
    login_manager = LoginManager()

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'error': 'Unauthorized'}), 401

    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)

#TODO: Change this for prod
    app.config.update(
        SESSION_COOKIE_SAMESITE='None',
        SESSION_COOKIE_SECURE=True  # True for HTTPS
    )


    # Extensions
    CORS(app,
         supports_credentials=True,
         resources={
             r"/auth/*": {"origins": "http://localhost:5173"},
             r"/api/*": {"origins": "http://localhost:5173"},
             r"/pins/*": {"origins": "http://localhost:5173"},
             r"/export/*": {"origins": "http://localhost:5173"},
         }
         )
    migrate = Migrate(app, db)
    db.init_app(app)
    # Register Blueprints
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    app.register_blueprint(main_blueprint, url_prefix='/api')
    app.register_blueprint(pins_blueprint, url_prefix='/pins')
    app.register_blueprint(export_blueprint, url_prefix='/export')

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app
