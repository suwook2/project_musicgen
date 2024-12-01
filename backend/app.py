# backend/app.py

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func

# MusicGenerator 모듈을 올바르게 임포트해야 합니다.
from musicgen import MusicGenerator

app = Flask(__name__)
CORS(app)  # 프론트엔드와의 CORS 문제 해결

# MySQL 데이터베이스 연결 설정
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:dl452852@localhost/musicdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
api = Api(app)

# 데이터베이스 모델 정의
class User(db.Model):
    __tablename__ = 'Users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=func.current_timestamp())

    # 외래 키 삭제 시 관련 음악들도 함께 삭제
    music = db.relationship('Music', backref='owner', lazy=True, cascade="all, delete-orphan")

class Genre(db.Model):
    __tablename__ = 'Genres'
    genre_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    music = db.relationship('Music', backref='genre_detail', lazy=True)

class Music(db.Model):
    __tablename__ = 'Music'
    music_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'), nullable=False)
    title = db.Column(db.String(100), unique=True, nullable=False)
    genre_id = db.Column(db.Integer, db.ForeignKey('Genres.genre_id'), nullable=False)
    prompt = db.Column(db.Text)
    original_audio_path = db.Column(db.String(255))
    generated_audio_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=func.current_timestamp())

# 생성된 음악 파일을 저장할 디렉토리 설정
GENERATED_MUSIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_music')
os.makedirs(GENERATED_MUSIC_DIR, exist_ok=True)

# Health Check Resource
class HealthCheck(Resource):
    def get(self):
        return {'message': 'Backend is running'}, 200

api.add_resource(HealthCheck, '/api/health')

# 사용자 생성 API Resource
class CreateUser(Resource):
    def post(self):
        data = request.json
        name = data.get('name')

        if not name:
            return {'message': '이름을 입력해주세요.'}, 400

        if User.query.filter_by(name=name).first():
            return {'message': '이미 존재하는 사용자입니다.'}, 400

        try:
            new_user = User(name=name)
            db.session.add(new_user)
            db.session.commit()
            return {
                'message': '사용자가 생성되었습니다.',
                'user': {
                    'user_id': new_user.user_id,
                    'name': new_user.name
                }
            }, 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'message': '사용자 생성 중 오류가 발생했습니다.', 'error': str(e)}, 500

api.add_resource(CreateUser, '/api/users')

# 사용자 삭제 API Resource
class DeleteUser(Resource):
    def delete(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {'message': '사용자를 찾을 수 없습니다.'}, 404

        try:
            db.session.delete(user)
            db.session.commit()
            return {'message': '사용자와 관련된 음악이 성공적으로 삭제되었습니다.'}, 200
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'message': '사용자 삭제 중 오류가 발생했습니다.', 'error': str(e)}, 500

api.add_resource(DeleteUser, '/api/users/<int:user_id>')

# 사용자 목록 조회 API Resource
class GetUsers(Resource):
    def get(self):
        try:
            users = User.query.all()
            result = [{"user_id": user.user_id, "name": user.name} for user in users]
            return jsonify(result)
        except SQLAlchemyError as e:
            return {'message': '사용자 목록을 불러오는 데 실패했습니다.', 'error': str(e)}, 500

api.add_resource(GetUsers, '/api/users')

# 장르 목록 조회 및 추가 API Resource
class GenreList(Resource):
    def get(self):
        try:
            genres = Genre.query.all()
            result = [{"genre_id": genre.genre_id, "name": genre.name} for genre in genres]
            return jsonify(result)
        except SQLAlchemyError as e:
            return {'message': '장르 목록을 불러오는 데 실패했습니다.', 'error': str(e)}, 500

    def post(self):
        data = request.json
        name = data.get('name')

        if not name:
            return {'message': '장르 이름을 입력해주세요.'}, 400

        if Genre.query.filter_by(name=name).first():
            return {'message': '이미 존재하는 장르입니다.'}, 400

        try:
            new_genre = Genre(name=name)
            db.session.add(new_genre)
            db.session.commit()
            return {'message': '장르가 추가되었습니다.', 'genre': {'genre_id': new_genre.genre_id, 'name': new_genre.name}}, 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return {'message': '장르 추가 중 오류가 발생했습니다.', 'error': str(e)}, 500

api.add_resource(GenreList, '/api/genres')

# 음악 생성 API Resource (트랜잭션 적용)
class CreateMusic(Resource):
    def post(self):
        data = request.json
        user_id = data.get('user_id')
        title = data.get('title')
        genre_id = data.get('genre_id')  # 장르 ID로 변경
        prompt = data.get('prompt')

        if not user_id or not title or not genre_id:
            return {'message': '사용자 ID, 제목, 장르를 입력해주세요.'}, 400

        if Music.query.filter_by(title=title).first():
            return {'message': '이미 존재하는 제목입니다.'}, 400

        try:
            with db.session.begin_nested():
                # MusicGenerator를 사용하여 음악 생성
                generated_audio_filename = f"{title}.wav"
                generated_audio_path = os.path.join(GENERATED_MUSIC_DIR, generated_audio_filename)

                generator = MusicGenerator()
                generator.generate_music(prompt=prompt, output_path=generated_audio_path)

                new_music = Music(
                    user_id=user_id,
                    title=title,
                    genre_id=genre_id,
                    prompt=prompt,
                    generated_audio_path=generated_audio_path
                )
                db.session.add(new_music)

            db.session.commit()
            return {
                'message': '음악이 성공적으로 생성되고 저장되었습니다.',
                'music': {
                    'music_id': new_music.music_id,
                    'title': new_music.title,
                    'genre_id': new_music.genre_id,
                    'prompt': new_music.prompt,
                    'generated_audio_path': f"/generated_music/{generated_audio_filename}",
                    'created_at': new_music.created_at.strftime('%Y-%m-%d %H:%M:%S')
                }
            }, 201

        except Exception as e:
            db.session.rollback()
            if os.path.exists(generated_audio_path):
                os.remove(generated_audio_path)
            return {'message': '음악 생성에 실패했습니다.', 'error': str(e)}, 500

api.add_resource(CreateMusic, '/api/music')

# 음악 삭제 API Resource
class MusicDetail(Resource):
    def delete(self, music_id):
        music = Music.query.get(music_id)
        if not music:
            return {'message': '해당 음악을 찾을 수 없습니다.'}, 404

        try:
            # 음악 파일 삭제
            if os.path.exists(music.generated_audio_path):
                os.remove(music.generated_audio_path)

            # 데이터베이스에서 삭제
            db.session.delete(music)
            db.session.commit()
            return {'message': '음악이 성공적으로 삭제되었습니다.'}, 200
        except Exception as e:
            db.session.rollback()
            return {'message': '음악 삭제 중 오류가 발생했습니다.', 'error': str(e)}, 500

api.add_resource(MusicDetail, '/api/music/<int:music_id>')

# 음악 목록 조회 API Resource
class GetMusic(Resource):
    def get(self):
        user_id = request.args.get('user_id')
        title = request.args.get('title')

        if not user_id:
            return {'message': '사용자 ID를 전달해주세요.'}, 400

        try:
            query = Music.query.filter_by(user_id=user_id)
            if title:
                query = query.filter(Music.title.like(f"%{title}%"))

            musics = query.all()
            result = []
            for music in musics:
                result.append({
                    'music_id': music.music_id,
                    'title': music.title,
                    'genre_id': music.genre_id,
                    'prompt': music.prompt,
                    'generated_audio_path': f"/generated_music/{os.path.basename(music.generated_audio_path)}",
                    'created_at': music.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })

            return jsonify(result)
        except SQLAlchemyError as e:
            return {'message': '음악 목록을 불러오는 데 실패했습니다.', 'error': str(e)}, 500

api.add_resource(GetMusic, '/api/music')

# 사용자별 장르 분포 조회 API Resource
class GenreDistribution(Resource):
    def get(self, user_id):
        user = User.query.get(user_id)
        if not user:
            return {'message': '사용자를 찾을 수 없습니다.'}, 404

        try:
            genre_counts = db.session.query(Genre.name, func.count(Music.music_id)) \
                .join(Music, Music.genre_id == Genre.genre_id) \
                .filter(Music.user_id == user_id) \
                .group_by(Genre.name) \
                .all()

            distribution = [{"genre": genre, "count": count} for genre, count in genre_counts]
            return jsonify(distribution)
        except SQLAlchemyError as e:
            return {'message': '장르 분포를 불러오는 데 실패했습니다.', 'error': str(e)}, 500

api.add_resource(GenreDistribution, '/api/users/<int:user_id>/genre_distribution')

# 생성된 음악 파일을 제공하는 라우트
@app.route('/generated_music/<filename>')
def get_generated_music(filename):
    return send_from_directory(GENERATED_MUSIC_DIR, filename)

# 테이블 생성
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
