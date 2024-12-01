# backend/app.py

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
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
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Music(db.Model):
    __tablename__ = 'Music'
    music_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.user_id'))
    title = db.Column(db.String(100), unique=True, nullable=False)
    genre = db.Column(db.String(50), nullable=False)
    prompt = db.Column(db.Text)
    original_audio_path = db.Column(db.String(255))
    generated_audio_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# 생성된 음악 파일을 저장할 디렉토리 설정
GENERATED_MUSIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_music')
os.makedirs(GENERATED_MUSIC_DIR, exist_ok=True)

# Health Check Resource
class HealthCheck(Resource):
    def get(self):
        return {'message': 'Backend is running'}, 200

api.add_resource(HealthCheck, '/api/health')

# 음악 생성 API Resource
class CreateMusic(Resource):
    def post(self):
        data = request.json
        title = data.get('title')
        genre = data.get('genre')
        prompt = data.get('prompt')

        # 입력 데이터 검증
        if not title or not genre or not prompt:
            return {'message': '저장할 제목, 장르, 프롬프트는 필수 항목입니다.'}, 400

        # 제목 중복 확인
        existing_music = Music.query.filter_by(title=title).first()
        if existing_music:
            return {'message': '이미 존재하는 제목입니다.'}, 400

        # 음악 파일 경로 설정
        generated_audio_filename = f"{title}.wav"
        generated_audio_path = os.path.join(GENERATED_MUSIC_DIR, generated_audio_filename)

        # MusicGenerator를 사용하여 음악 생성
        generator = MusicGenerator()
        try:
            generator.generate_music(prompt=prompt, output_path=generated_audio_path)
        except Exception as e:
            return {'message': '음악 생성에 실패했습니다.', 'error': str(e)}, 500

        # 트랜잭션을 사용하여 데이터베이스에 저장
        try:
            new_music = Music(
                title=title,
                genre=genre,
                prompt=prompt,
                generated_audio_path=generated_audio_path
            )
            db.session.add(new_music)
            db.session.commit()
            return {'message': '음악이 성공적으로 생성되고 저장되었습니다.'}, 201
        except Exception as e:
            db.session.rollback()
            if os.path.exists(generated_audio_path):
                os.remove(generated_audio_path)
            return {'message': '데이터베이스에 저장하는 중 오류가 발생했습니다.', 'error': str(e)}, 500

api.add_resource(CreateMusic, '/api/music')

# 음악 조회 및 삭제 API Resource
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

# 음악 조회 API Resource
class GetMusic(Resource):
    def get(self):
        genre = request.args.get('genre')
        title = request.args.get('title')

        query = Music.query
        if genre:
            query = query.filter_by(genre=genre)
        if title:
            query = query.filter(Music.title.like(f"%{title}%"))

        musics = query.all()
        result = []
        for music in musics:
            result.append({
                'music_id': music.music_id,
                'title': music.title,
                'genre': music.genre,
                'prompt': music.prompt,
                'generated_audio_path': f"/generated_music/{os.path.basename(music.generated_audio_path)}",
                'created_at': music.created_at.strftime('%Y-%m-%d %H:%M:%S')
            })

        return jsonify(result)

api.add_resource(GetMusic, '/api/music')

# 생성된 음악 파일을 제공하는 라우트
@app.route('/generated_music/<filename>')
def get_generated_music(filename):
    return send_from_directory(GENERATED_MUSIC_DIR, filename)

# 테이블 생성
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
