from app import db
from datetime import datetime


class NoteContributor(db.Model):
    __tablename__ = 'note_contributors'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    note_id = db.Column(db.Integer, db.ForeignKey('notes.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('note_id', 'user_id', name='unique_contributor'),)

    note = db.relationship('Note', backref=db.backref('contributors', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('contributions', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'note_id': self.note_id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
