from .pins import pins
from .main import main
from .auth import auth


def register_routes(app):
    app.register_blueprint(main)
    app.register_blueprint(auth)
    app.register_blueprint(pins)