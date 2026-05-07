from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.note import Note
from app.models.favorite import Favorite
from app.models.contributor import NoteContributor
from app.utils import superadmin_required

admin_bp = Blueprint('admin', __name__)


# ==================== USER MANAGEMENT ====================

@admin_bp.route('/users', methods=['GET'])
@superadmin_required
def get_all_users(current_user_id):
    """List all registered users with pagination and search."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()

    query = User.query

    if search:
        query = query.filter(
            db.or_(
                User.username.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )

    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    users = []
    for user in pagination.items:
        user_data = user.to_dict()
        user_data['notes_count'] = Note.query.filter_by(user_id=user.id).count()
        users.append(user_data)

    return jsonify({
        'users': users,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@superadmin_required
def get_user_detail(current_user_id, user_id):
    """Get detailed user information."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    user_data = user.to_dict()
    user_data['notes_count'] = Note.query.filter_by(user_id=user.id).count()
    user_data['favorites_count'] = Favorite.query.filter_by(user_id=user.id).count()

    return jsonify({'user': user_data}), 200


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@superadmin_required
def update_user(current_user_id, user_id):
    """Edit user profile (username, email)."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'username' in data:
        new_username = data['username'].strip()
        if new_username and new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                return jsonify({'error': 'Username sudah digunakan'}), 409
            user.username = new_username

    if 'email' in data:
        new_email = data['email'].strip()
        if new_email and new_email != user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'Email sudah digunakan'}), 409
            user.email = new_email

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password minimal 6 karakter'}), 400
        user.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'message': 'User berhasil diupdate',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@superadmin_required
def delete_user(current_user_id, user_id):
    """Delete a user and all their notes."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({'message': f'User {user.username} berhasil dihapus'}), 200


@admin_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@superadmin_required
def ban_user(current_user_id, user_id):
    """Ban a user."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    if user.is_banned:
        return jsonify({'error': 'User sudah di-banned'}), 400

    user.is_banned = True
    db.session.commit()

    return jsonify({
        'message': f'User {user.username} berhasil di-banned',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@superadmin_required
def unban_user(current_user_id, user_id):
    """Unban a user."""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    if not user.is_banned:
        return jsonify({'error': 'User tidak sedang di-banned'}), 400

    user.is_banned = False
    db.session.commit()

    return jsonify({
        'message': f'User {user.username} berhasil di-unban',
        'user': user.to_dict()
    }), 200


# ==================== NOTES MANAGEMENT ====================

@admin_bp.route('/notes', methods=['GET'])
@superadmin_required
def get_all_notes(current_user_id):
    """List all notes (including private and protected, bypasses password)."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '', type=str).strip()

    query = Note.query

    if search:
        query = query.filter(Note.title.ilike(f'%{search}%'))

    query = query.order_by(Note.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    notes = []
    for note in pagination.items:
        note_data = {
            'id': note.id,
            'title': note.title,
            'content': note.content,  # Always show content for admin
            'visibility': note.visibility,
            'user_id': note.user_id,
            'author': note.author.to_dict() if note.author else None,
            'created_at': note.created_at.isoformat() if note.created_at else None,
            'updated_at': note.updated_at.isoformat() if note.updated_at else None,
            'favorite_count': len(note.favorites) if note.favorites else 0,
        }
        notes.append(note_data)

    return jsonify({
        'notes': notes,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/notes/<int:note_id>', methods=['GET'])
@superadmin_required
def get_note_detail(current_user_id, note_id):
    """Get full note detail (bypasses password protection)."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note tidak ditemukan'}), 404

    note_data = {
        'id': note.id,
        'title': note.title,
        'content': note.content,
        'visibility': note.visibility,
        'user_id': note.user_id,
        'author': note.author.to_dict() if note.author else None,
        'created_at': note.created_at.isoformat() if note.created_at else None,
        'updated_at': note.updated_at.isoformat() if note.updated_at else None,
        'favorite_count': len(note.favorites) if note.favorites else 0,
    }

    return jsonify({'note': note_data}), 200


@admin_bp.route('/notes/<int:note_id>', methods=['PUT'])
@superadmin_required
def update_note(current_user_id, note_id):
    """Edit any note as admin."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note tidak ditemukan'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'title' in data:
        note.title = data['title'].strip()
    if 'content' in data:
        note.content = data['content'].strip()
    if 'visibility' in data:
        new_visibility = data['visibility']
        if new_visibility not in ['public', 'private', 'protected']:
            return jsonify({'error': 'Invalid visibility type'}), 400
        # If changing from protected to non-protected, clear password
        if note.visibility == 'protected' and new_visibility != 'protected':
            note.password_hash = None
        note.visibility = new_visibility

    db.session.commit()

    return jsonify({
        'message': 'Note berhasil diupdate',
        'note': {
            'id': note.id,
            'title': note.title,
            'content': note.content,
            'visibility': note.visibility,
            'user_id': note.user_id,
            'author': note.author.to_dict() if note.author else None,
            'created_at': note.created_at.isoformat() if note.created_at else None,
            'updated_at': note.updated_at.isoformat() if note.updated_at else None,
        }
    }), 200


@admin_bp.route('/notes/<int:note_id>', methods=['DELETE'])
@superadmin_required
def delete_note(current_user_id, note_id):
    """Delete any note as admin."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note tidak ditemukan'}), 404

    title = note.title
    db.session.delete(note)
    db.session.commit()

    return jsonify({'message': f'Note "{title}" berhasil dihapus'}), 200


# ==================== STATS ====================

@admin_bp.route('/stats', methods=['GET'])
@superadmin_required
def get_stats(current_user_id):
    """Get dashboard statistics."""
    total_users = User.query.count()
    total_notes = Note.query.count()
    banned_users = User.query.filter_by(is_banned=True).count()
    public_notes = Note.query.filter_by(visibility='public').count()
    private_notes = Note.query.filter_by(visibility='private').count()
    protected_notes = Note.query.filter_by(visibility='protected').count()

    return jsonify({
        'total_users': total_users,
        'total_notes': total_notes,
        'banned_users': banned_users,
        'public_notes': public_notes,
        'private_notes': private_notes,
        'protected_notes': protected_notes,
    }), 200
