// frontend/src/components/MusicGenerator.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MusicGenerator.css';

function MusicGenerator({ selectedUser, onMusicCreated }) {
  const [title, setTitle] = useState('');
  const [genreId, setGenreId] = useState('');
  const [genres, setGenres] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 장르 목록을 불러오는 함수
  const fetchGenres = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/genres');
      setGenres(response.data);
      if (response.data.length > 0) {
        setGenreId(response.data[0].genre_id); // 기본 선택값 설정
      }
    } catch (err) {
      console.error(err);
      setError('장르 목록을 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('사용자를 먼저 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');

    const data = {
      user_id: selectedUser.user_id,
      title,
      genre_id: genreId,
      prompt,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/music', data, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      alert(response.data.message);
      setTitle('');
      setGenreId(genres.length > 0 ? genres[0].genre_id : '');
      setPrompt('');
      if (onMusicCreated) {
        onMusicCreated();
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('음악 생성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>음악 생성</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} className="music-generator-form">
        <div>
          <label>저장할 제목:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>장르:</label>
          <select
            value={genreId}
            onChange={(e) => setGenreId(e.target.value)}
            required
          >
            {genres.map((genre) => (
              <option key={genre.genre_id} value={genre.genre_id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>프롬프트 (분위기, 사용할 악기 등):</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
            placeholder="예: Happy mood with guitar and drums"
          ></textarea>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '생성 중...' : '음악 생성'}
        </button>
      </form>
    </div>
  );
}

export default MusicGenerator;
