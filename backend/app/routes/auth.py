from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.utils import generate_token, token_required
import jwt
import os
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

SECURITY_QUESTIONS = [
    'Siapa nama ibu kandung Anda?',
    'Apa nama hewan peliharaan pertama Anda?',
    'Di kota mana Anda dilahirkan?',
    'Di kota mana Anda tinggal saat ini?',
    'Apa nama sekolah dasar Anda?',
    'Apa makanan favorit Anda?',
]


@auth_bp.route('/security-questions', methods=['GET'])
def get_security_questions():
    return jsonify({'questions': SECURITY_QUESTIONS}), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    security_question = data.get('security_question', '').strip()
    security_answer = data.get('security_answer', '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if not security_question or not security_answer:
        return jsonify({'error': 'Security question and answer are required'}), 400

    if security_question not in SECURITY_QUESTIONS:
        return jsonify({'error': 'Invalid security question'}), 400

    if len(security_answer) < 2:
        return jsonify({'error': 'Security answer must be at least 2 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(username=username, email=email, security_question=security_question)
    user.set_password(password)
    user.set_security_answer(security_answer)

    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)

    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_token(user.id)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Step 1: Get security question for an email."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip()
    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Email tidak ditemukan'}), 404

    if not user.security_question:
        return jsonify({'error': 'Akun ini belum memiliki pertanyaan keamanan'}), 400

    return jsonify({
        'email': email,
        'security_question': user.security_question
    }), 200


@auth_bp.route('/verify-security-answer', methods=['POST'])
def verify_security_answer():
    """Step 2: Verify security answer and return a reset token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email', '').strip()
    answer = data.get('security_answer', '').strip()

    if not email or not answer:
        return jsonify({'error': 'Email and security answer are required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Email tidak ditemukan'}), 404

    if not user.check_security_answer(answer):
        return jsonify({'error': 'Jawaban keamanan salah'}), 401

    # Generate a short-lived reset token (15 min)
    secret = os.environ.get('JWT_SECRET_KEY', 'fallback-secret')
    reset_token = jwt.encode(
        {'user_id': user.id, 'purpose': 'reset', 'exp': datetime.utcnow() + timedelta(minutes=15)},
        secret,
        algorithm='HS256'
    )

    return jsonify({
        'message': 'Verifikasi berhasil',
        'reset_token': reset_token
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Step 3: Reset password using the reset token."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    reset_token = data.get('reset_token', '')
    new_password = data.get('new_password', '')

    if not reset_token or not new_password:
        return jsonify({'error': 'Reset token and new password are required'}), 400

    if len(new_password) < 6:
        return jsonify({'error': 'Password minimal 6 karakter'}), 400

    # Verify reset token
    secret = os.environ.get('JWT_SECRET_KEY', 'fallback-secret')
    try:
        payload = jwt.decode(reset_token, secret, algorithms=['HS256'])
        if payload.get('purpose') != 'reset':
            return jsonify({'error': 'Token tidak valid'}), 400
        user_id = payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token sudah kadaluarsa, silakan ulangi proses'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Token tidak valid'}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User tidak ditemukan'}), 404

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password berhasil direset! Silakan login dengan password baru.'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_profile(current_user_id):
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'username' in data:
        new_username = data['username'].strip()
        if new_username and new_username != user.username:
            existing = User.query.filter_by(username=new_username).first()
            if existing:
                return jsonify({'error': 'Username already taken'}), 409
            user.username = new_username

    if 'email' in data:
        new_email = data['email'].strip()
        if new_email and new_email != user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing:
                return jsonify({'error': 'Email already taken'}), 409
            user.email = new_email

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    db.session.commit()

    return jsonify({
        'message': 'Profile updated',
        'user': user.to_dict()
    }), 200
