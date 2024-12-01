// frontend/src/components/MusicGenerator.js

import React, { useState } from 'react';
import axios from 'axios';

function MusicGenerator({ onMusicCreated }) {
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const data = {
      title,
      genre,
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
      setGenre('');
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
      <form onSubmit={handleSubmit}>
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
          <select value={genre} onChange={(e) => setGenre(e.target.value)} required>
            <option value="">장르 선택</option>
            <option value="Pop">Pop</option>
            <option value="Rock">Rock</option>
            <option value="Jazz">Jazz</option>
            <option value="Classical">Classical</option>
            <option value="Hip-Hop">Hip-Hop</option>
          </select>
        </div>
        <div>
          <label>프롬프트 (분위기, 사용할 악기를 영어로 입력하세요):</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          ></textarea>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? '생성 중...' : '음악 생성'}
        </button>
      </form>
    </div>
  );
}

export default MusicGenerator;
