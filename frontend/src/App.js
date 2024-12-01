// frontend/src/App.js

import React, { useState } from 'react';
import MusicGenerator from './components/MusicGenerator';
import MusicList from './components/MusicList';
import GenreChart from './components/GenreChart';
import './App.css';

function App() {
  const [refresh, setRefresh] = useState(false);

  const handleMusicCreated = () => {
    // 음악 생성 후 목록과 차트를 새로고침하기 위해 상태 변경
    setRefresh(!refresh);
  };

  return (
    <div className="App">
      <h1>나만의 뮤직 크리에이터</h1>
      <div className="container">
        <div className="left-pane">
          <MusicGenerator onMusicCreated={handleMusicCreated} />
        </div>
        <div className="center-pane">
          <MusicList key={refresh} />
        </div>
        <div className="right-pane">
          <GenreChart key={refresh} />
        </div>
      </div>
    </div>
  );
}

export default App;
