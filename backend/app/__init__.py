from flask import Flask
from flask_cors import CORS

from .extensions import db
from .routes import register_routes
from .routes.auth import auth as auth_blueprint
from .routes.main import main as main_blueprint

def create_app():
    app = Flask(__name__)

    # Config
    app.config['SECRET_KEY'] = 'your-secret-key'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flights.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Extensions
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    app.register_blueprint(main_blueprint, url_prefix='/api')

    return app
