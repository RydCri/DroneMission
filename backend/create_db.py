from run import app
from app.extensions import db
from app.models import User


with app.app_context():
    db.create_all()
    print("✅ Database tables created.")

    if not User.query.filter_by(email='test@example.com').first():
        test_user = User(username='testuser', email='test@example.com')
        test_user.set_password('test123')
        db.session.add(test_user)
        db.session.commit()
        print("✅ Test user created: testuser / test@example.com / test123")
    else:
        print("ℹ️ Test user already exists.")