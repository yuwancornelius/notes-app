from flask import Blueprint, request, jsonify
from app import db
from app.models.note import Note
from app.models.user import User
from app.models.favorite import Favorite
from app.utils import token_required, optional_token

notes_bp = Blueprint('notes', __name__)


@notes_bp.route('', methods=['POST'])
@token_required
def create_note(current_user_id):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    visibility = data.get('visibility', 'public')
    password = data.get('password', None)

    if not title or not content:
        return jsonify({'error': 'Title and content are required'}), 400

    if visibility not in ['public', 'private', 'protected']:
        return jsonify({'error': 'Invalid visibility type'}), 400

    if visibility == 'protected' and not password:
        return jsonify({'error': 'Password is required for protected notes'}), 400

    note = Note(
        title=title,
        content=content,
        visibility=visibility,
        user_id=current_user_id
    )

    if visibility == 'protected' and password:
        note.set_password(password)

    db.session.add(note)
    db.session.commit()

    return jsonify({
        'message': 'Note created successfully',
        'note': note.to_dict(current_user_id=current_user_id)
    }), 201


@notes_bp.route('', methods=['GET'])
@optional_token
def get_notes(current_user_id):
    """Get all public notes (explore page)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()

    query = Note.query.filter_by(visibility='public')

    if search:
        query = query.filter(Note.title.ilike(f'%{search}%'))

    query = query.order_by(Note.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    notes = []
    for note in pagination.items:
        note_data = note.to_dict(include_content=False, current_user_id=current_user_id)
        # Check if current user has favorited this note
        if current_user_id:
            fav = Favorite.query.filter_by(user_id=current_user_id, note_id=note.id).first()
            note_data['is_favorited'] = fav is not None
        else:
            note_data['is_favorited'] = False
        notes.append(note_data)

    return jsonify({
        'notes': notes,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@notes_bp.route('/my', methods=['GET'])
@token_required
def get_my_notes(current_user_id):
    """Get all notes by current user."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()

    query = Note.query.filter_by(user_id=current_user_id)

    if search:
        query = query.filter(Note.title.ilike(f'%{search}%'))

    query = query.order_by(Note.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    notes = []
    for note in pagination.items:
        note_data = note.to_dict(include_content=False, current_user_id=current_user_id)
        fav = Favorite.query.filter_by(user_id=current_user_id, note_id=note.id).first()
        note_data['is_favorited'] = fav is not None
        notes.append(note_data)

    return jsonify({
        'notes': notes,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@notes_bp.route('/<int:note_id>', methods=['GET'])
@optional_token
def get_note(current_user_id, note_id):
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    # Private note — only author can view
    if note.visibility == 'private' and note.user_id != current_user_id:
        return jsonify({'error': 'This note is private'}), 403

    note_data = note.to_dict(current_user_id=current_user_id)

    if current_user_id:
        fav = Favorite.query.filter_by(user_id=current_user_id, note_id=note.id).first()
        note_data['is_favorited'] = fav is not None
    else:
        note_data['is_favorited'] = False

    return jsonify({'note': note_data}), 200


@notes_bp.route('/<int:note_id>/verify-password', methods=['POST'])
@optional_token
def verify_note_password(current_user_id, note_id):
    """Verify password for a protected note. Everyone must enter password, including the owner."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    if note.visibility != 'protected':
        return jsonify({'error': 'This note is not protected'}), 400

    data = request.get_json()
    password = data.get('password', '') if data else ''

    if not password:
        return jsonify({'error': 'Password is required'}), 400

    if note.check_password(password):
        note_data = note.to_dict(current_user_id=current_user_id)
        note_data['content'] = note.content  # Override — password verified
        return jsonify({'verified': True, 'note': note_data}), 200
    else:
        return jsonify({'verified': False, 'error': 'Incorrect password'}), 401


@notes_bp.route('/<int:note_id>', methods=['PUT'])
@token_required
def update_note(current_user_id, note_id):
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    if note.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()

    if 'title' in data:
        note.title = data['title'].strip()
    if 'content' in data:
        note.content = data['content'].strip()

    new_visibility = data.get('visibility', note.visibility)
    if new_visibility not in ['public', 'private', 'protected']:
        return jsonify({'error': 'Invalid visibility type'}), 400

    # Switching FROM protected to public/private — require old protected password
    if note.visibility == 'protected' and new_visibility in ['public', 'private']:
        old_password = data.get('old_password', '')
        if not old_password:
            return jsonify({'error': 'Password note lama harus diisi untuk mengubah visibilitas', 'error_type': 'old_password'}), 400
        if not note.check_password(old_password):
            return jsonify({'error': 'Password note lama salah', 'error_type': 'old_password'}), 401
        # Clear the password hash since no longer protected
        note.password_hash = None

    # Changing/setting protected password requires verification
    new_password = data.get('password', None)
    if new_visibility == 'protected' and new_password:
        if len(new_password) < 4:
            return jsonify({'error': 'Password baru minimal 4 karakter', 'error_type': 'new_password'}), 400
        # If note was already protected, require old password + account password
        if note.visibility == 'protected' and note.password_hash:
            old_password = data.get('old_password', '')
            account_password = data.get('account_password', '')
            if not old_password:
                return jsonify({'error': 'Password note lama harus diisi', 'error_type': 'old_password'}), 400
            if not note.check_password(old_password):
                return jsonify({'error': 'Password note lama salah', 'error_type': 'old_password'}), 401
            if not account_password:
                return jsonify({'error': 'Password akun harus diisi', 'error_type': 'account_password'}), 400
            user = User.query.get(current_user_id)
            if not user or not user.check_password(account_password):
                return jsonify({'error': 'Password akun salah', 'error_type': 'account_password'}), 401
        note.set_password(new_password)
    elif new_visibility == 'protected' and not note.password_hash:
        # Switching to protected but no password provided
        return jsonify({'error': 'Password harus diisi untuk note protected'}), 400

    note.visibility = new_visibility
    db.session.commit()

    return jsonify({
        'message': 'Note updated successfully',
        'note': note.to_dict(current_user_id=current_user_id)
    }), 200


@notes_bp.route('/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user_id, note_id):
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    if note.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(note)
    db.session.commit()

    return jsonify({'message': 'Note deleted successfully'}), 200
