from .pins import pins
from .main import main
from .auth import auth
from .export import export


def register_routes(app):
    app.register_blueprint(main)
    app.register_blueprint(auth)
    app.register_blueprint(pins)
    app.register_blueprint(export)
