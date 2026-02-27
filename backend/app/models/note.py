from app import db
from datetime import datetime
import bcrypt


class Note(db.Model):
    __tablename__ = 'notes'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    visibility = db.Column(db.String(20), nullable=False, default='public')  # public, private, protected
    password_hash = db.Column(db.String(255), default=None)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    favorites = db.relationship('Favorite', backref='note', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        if password:
            self.password_hash = bcrypt.hashpw(
                password.encode('utf-8'), bcrypt.gensalt()
            ).decode('utf-8')

    def check_password(self, password):
        if not self.password_hash:
            return False
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_dict(self, include_content=True, current_user_id=None):
        data = {
            'id': self.id,
            'title': self.title,
            'visibility': self.visibility,
            'is_protected': self.visibility == 'protected',
            'user_id': self.user_id,
            'author': self.author.to_dict() if self.author else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'favorite_count': len(self.favorites) if self.favorites else 0,
        }

        # Protected notes: ALWAYS hide content (must verify password first)
        if self.visibility == 'protected':
            data['content'] = None
        elif include_content:
            data['content'] = self.content
        else:
            data['content'] = self.content[:100] + '...' if self.content and len(self.content) > 100 else self.content

        return data
