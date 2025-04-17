import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate

from .extensions import db
from .routes import register_routes
from .routes.auth import auth as auth_blueprint
from .routes.main import main as main_blueprint
from .routes.pins import pins as pins_blueprint

def create_app():
    app = Flask(__name__)
    # Config
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flights.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
    app.config.from_object('config.Config')



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
         }
         )
    migrate = Migrate(app, db)
    db.init_app(app)
    # Register Blueprints
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    app.register_blueprint(main_blueprint, url_prefix='/api')
    app.register_blueprint(pins_blueprint, url_prefix='/pins')

    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    return app
