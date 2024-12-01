// frontend/src/components/MusicList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MusicList.css';
import GenreChart from './GenreChart'; // GenreChart 컴포넌트 임포트

function MusicList({ selectedUser }) {
  const [musics, setMusics] = useState([]);
  const [titleSearch, setTitleSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [genreData, setGenreData] = useState([]);

  const fetchMusics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { user_id: selectedUser.user_id };
      if (titleSearch.trim() !== '') {
        params.title = titleSearch.trim();
      }

      const response = await axios.get('http://localhost:5000/api/music', { params });
      setMusics(response.data);
    } catch (err) {
      console.error(err);
      setError('음악을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenreDistribution = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${selectedUser.user_id}/genre_distribution`);
      setGenreData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchMusics();
      fetchGenreDistribution();
    }
    // eslint-disable-next-line
  }, [selectedUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMusics();
  };

  const handleReset = () => {
    setTitleSearch('');
    fetchMusics();
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = async (music_id) => {
    if (!window.confirm('정말 이 음악을 삭제하시겠습니까?')) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/music/${music_id}`);
      alert(response.data.message);
      fetchMusics();
      fetchGenreDistribution();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        alert(`삭제 실패: ${err.response.data.message}`);
      } else {
        alert('음악 삭제에 실패했습니다.');
      }
    }
  };

  const sortedMusics = React.useMemo(() => {
    let sortableMusics = [...musics];
    if (sortConfig !== null) {
      sortableMusics.sort((a, b) => {
        if (sortConfig.key === 'genre_detail.name') {
          if (a.genre_id < b.genre_id) return sortConfig.direction === 'asc' ? -1 : 1;
          if (a.genre_id > b.genre_id) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableMusics;
  }, [musics, sortConfig]);

  return (
    <div className="music-list-container">
      <h2>{selectedUser.name}의 음악 목록</h2>
      <form onSubmit={handleSearch} className="search-form">
        <div>
          <label>제목 검색:</label>
          <input
            type="text"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            placeholder="제목 검색"
          />
        </div>
        <button type="submit">검색</button>
        <button type="button" onClick={handleReset}>초기화</button>
      </form>
      <div className="music-table-and-chart">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('created_at')}>
                생성 날짜 {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('title')}>
                제목 {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('genre_detail.name')}>
                장르 {sortConfig.key === 'genre_detail.name' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('prompt')}>
                프롬프트 {sortConfig.key === 'prompt' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th>
                재생
              </th>
              <th>
                삭제
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedMusics.map((music) => (
              <tr key={music.music_id}>
                <td>{music.created_at}</td>
                <td>{music.title}</td>
                <td>{music.genre_id}</td>
                <td>{music.prompt}</td>
                <td>
                  <audio controls src={`http://localhost:5000${music.generated_audio_path}`}>
                    Your browser does not support the audio element.
                  </audio>
                </td>
                <td>
                  <button onClick={() => handleDelete(music.music_id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 오른쪽에만 GenreChart를 렌더링 */}
        <GenreChart genreData={genreData} />
      </div>
      {loading && <p>음악 목록 로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default MusicList;
