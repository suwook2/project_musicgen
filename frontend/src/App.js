// frontend/src/App.js

import React, { useState } from 'react';
import UserList from './components/UserList';
import MusicList from './components/MusicList';
import MusicGenerator from './components/MusicGenerator';
import GenreChart from './components/GenreChart';
import './App.css';

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [refresh, setRefresh] = useState(false); // 음악 생성 후 리프레시를 위한 상태

  const handleMusicCreated = () => {
    // 음악 생성 후 목록과 차트를 새로고침하기 위해 상태 변경
    setRefresh(!refresh);
  };

  return (
    <div className="App">
      <header>
        <h1>나만의 뮤직 크리에이터</h1>
      </header>
      <div className="container">
        <aside>
          <UserList setSelectedUser={setSelectedUser} />
        </aside>
        <main>
          {selectedUser ? (
            <>
              <MusicGenerator selectedUser={selectedUser} onMusicCreated={handleMusicCreated} />
              <MusicList selectedUser={selectedUser} key={refresh} />
            </>
          ) : (
            <p>사용자를 선택하세요.</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
