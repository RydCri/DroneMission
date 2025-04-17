import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, session, current_app
from ..models import Pin, PinImage, Tag
from ..extensions import db
from werkzeug.utils import secure_filename

pins = Blueprint('pins', __name__)


@pins.route('/', methods=['GET'])
def get_pins():
    # Pagination params
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)

    pins_query = Pin.query.order_by(Pin.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    pins_data = []
    for pin in pins_query.items:
        pins_data.append({
            'id': pin.id,
            'title': pin.title,
            'description': pin.description,
            'username': pin.user.username,
            'created_at': pin.created_at.isoformat(),
            'glbPath': f"/uploads/user_{pin.user.id}/models/{os.path.basename(pin.glb_path)}",
            'images': [
                f"/uploads/user_{pin.user.id}/images/{os.path.basename(img.image_path)}" for img in pin.images
            ],
            'tags': [tag.name for tag in pin.tags],
            'likes': pin.likes
        })

    return jsonify({
        'pins': pins_data,
        'total': pins_query.total,
        'pages': pins_query.pages,
        'current_page': pins_query.page
    }), 200


@pins.route('/upload', methods=['POST'])
def upload_pin():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    user_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], f'user_{user_id}')
    models_folder = os.path.join(user_folder, 'models')
    images_folder = os.path.join(user_folder, 'images')

    os.makedirs(models_folder, exist_ok=True)
    os.makedirs(images_folder, exist_ok=True)

    title = request.form.get('title')
    description = request.form.get('description', '')
    glb_file = request.files.get('model')
    image_files = request.files.getlist('images')
    tags = request.form.getlist('tags')  # Expects tags[]=tag1&tags[]=tag2 from frontend

    if not title or not glb_file:
        return jsonify({'error': 'Missing title or model file'}), 400

    # Validate .glb
    if not glb_file.filename.endswith('.glb'):
        return jsonify({'error': 'Invalid model format. Must be .glb'}), 400
    if len(glb_file.read()) > 100 * 1024 * 1024:
        return jsonify({'error': 'Model file too large'}), 400
    glb_file.seek(0)

    # Save .glb
    glb_ext = os.path.splitext(secure_filename(glb_file.filename))[1]
    glb_filename = f"{uuid.uuid4()}{glb_ext}"
    glb_path = os.path.join(models_folder, glb_filename)
    glb_file.save(glb_path)

    # Save images (max 5MB each)
    image_objs = []
    for img in image_files:
        if not img.filename:
            continue
        if len(img.read()) > 5 * 1024 * 1024:
            return jsonify({'error': f'Image {img.filename} exceeds 5MB'}), 400
        img.seek(0)

        img_ext = os.path.splitext(secure_filename(img.filename))[1]
        img_filename = f"{uuid.uuid4()}{img_ext}"
        img_path = os.path.join(images_folder, img_filename)
        img.save(img_path)

        image_objs.append(PinImage(image_path=img_path))

    # Deduplicate and fetch or create tags
    tag_objs = []
    unique_tags = set(tags)
    for tag_name in unique_tags:
        tag = Tag.query.filter_by(name=tag_name.lower()).first()
        if not tag:
            tag = Tag(name=tag_name.lower())
            db.session.add(tag)
        tag_objs.append(tag)

    # Create Pin
    new_pin = Pin(
        user_id=user_id,
        title=title,
        description=description,
        glb_path=glb_path,
        images=image_objs,
        tags=tag_objs,
        created_at=datetime.now(timezone.utc)
    )
    db.session.add(new_pin)
    db.session.commit()

    return jsonify({'message': 'Pin uploaded successfully', 'pin_id': new_pin.id}), 201


@pins.route('/user', methods=['GET'])
def get_user_pins():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    # Use base filename to construct public paths
    pins_query = Pin.query.get(user_id)
    pins_query = pins_query.query.order_by(Pin.created_at.desc())
    user_pins = []
    for pin in pins_query:
        user_pins.append({
            'id': pin.id,
            'title': pin.title,
            'description': pin.description,
            'username': pin.user.username,
            'created_at': pin.created_at.isoformat(),
            'glbPath': f"/uploads/user_{pin.user.id}/models/{os.path.basename(pin.glb_path)}",
            'images': [
                f"/uploads/user_{pin.user.id}/images/{os.path.basename(img.image_path)}" for img in pin.images
            ],
            'tags': [tag.name for tag in pin.tags]
        })

    return jsonify({'pins': user_pins}), 200

