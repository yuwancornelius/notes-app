from flask import Blueprint, request, jsonify
from app import db
from app.models.note import Note
from app.models.user import User
from app.models.contributor import NoteContributor
from app.utils import token_required

contributors_bp = Blueprint('contributors', __name__)


@contributors_bp.route('/<int:note_id>/contributors', methods=['GET'])
@token_required
def get_contributors(current_user_id, note_id):
    """Get all contributors for a note."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    # Only owner and contributors can see contributor list
    is_owner = note.user_id == current_user_id
    is_contributor = NoteContributor.query.filter_by(note_id=note_id, user_id=current_user_id).first() is not None

    if not is_owner and not is_contributor:
        return jsonify({'error': 'Unauthorized'}), 403

    contributors = NoteContributor.query.filter_by(note_id=note_id).all()
    return jsonify({
        'contributors': [c.to_dict() for c in contributors],
        'is_owner': is_owner,
    }), 200


@contributors_bp.route('/<int:note_id>/contributors', methods=['POST'])
@token_required
def add_contributor(current_user_id, note_id):
    """Add a contributor to a note by email. Only the owner can do this."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    if note.user_id != current_user_id:
        return jsonify({'error': 'Hanya pemilik note yang bisa menambah contributor'}), 403

    # Only public and protected notes can have contributors
    if note.visibility == 'private':
        return jsonify({'error': 'Note private tidak bisa memiliki contributor'}), 400

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email harus diisi'}), 400

    # Find user by email
    target_user = User.query.filter_by(email=email).first()
    if not target_user:
        return jsonify({'error': 'Email tidak ditemukan di database'}), 404

    # Can't add yourself
    if target_user.id == current_user_id:
        return jsonify({'error': 'Tidak bisa menambahkan diri sendiri sebagai contributor'}), 400

    # Check if already a contributor
    existing = NoteContributor.query.filter_by(note_id=note_id, user_id=target_user.id).first()
    if existing:
        return jsonify({'error': 'User sudah menjadi contributor'}), 409

    contributor = NoteContributor(note_id=note_id, user_id=target_user.id)
    db.session.add(contributor)
    db.session.commit()

    return jsonify({
        'message': 'Contributor berhasil ditambahkan',
        'contributor': contributor.to_dict()
    }), 201


@contributors_bp.route('/<int:note_id>/contributors/<int:user_id>', methods=['DELETE'])
@token_required
def remove_contributor(current_user_id, note_id, user_id):
    """Remove a contributor from a note. Owner can remove anyone, contributor can remove themselves."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    is_owner = note.user_id == current_user_id
    is_self = current_user_id == user_id

    if not is_owner and not is_self:
        return jsonify({'error': 'Unauthorized'}), 403

    contributor = NoteContributor.query.filter_by(note_id=note_id, user_id=user_id).first()
    if not contributor:
        return jsonify({'error': 'Contributor not found'}), 404

    db.session.delete(contributor)
    db.session.commit()

    return jsonify({'message': 'Contributor berhasil dihapus'}), 200
