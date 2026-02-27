from flask import Blueprint, request, jsonify
from app import db
from app.models.favorite import Favorite
from app.models.note import Note
from app.utils import token_required

favorites_bp = Blueprint('favorites', __name__)


@favorites_bp.route('', methods=['GET'])
@token_required
def get_favorites(current_user_id):
    """Get all favorited notes by current user."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    query = Favorite.query.filter_by(user_id=current_user_id)\
        .order_by(Favorite.created_at.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    notes = []
    for fav in pagination.items:
        note = Note.query.get(fav.note_id)
        if note and note.visibility != 'private':
            note_data = note.to_dict(include_content=False, current_user_id=current_user_id)
            note_data['is_favorited'] = True
            notes.append(note_data)

    return jsonify({
        'notes': notes,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@favorites_bp.route('/<int:note_id>', methods=['POST'])
@token_required
def toggle_favorite(current_user_id, note_id):
    """Toggle favorite status for a note."""
    note = Note.query.get(note_id)
    if not note:
        return jsonify({'error': 'Note not found'}), 404

    existing = Favorite.query.filter_by(
        user_id=current_user_id, note_id=note_id
    ).first()

    if existing:
        db.session.delete(existing)
        db.session.commit()
        return jsonify({'message': 'Removed from favorites', 'is_favorited': False}), 200
    else:
        fav = Favorite(user_id=current_user_id, note_id=note_id)
        db.session.add(fav)
        db.session.commit()
        return jsonify({'message': 'Added to favorites', 'is_favorited': True}), 200
