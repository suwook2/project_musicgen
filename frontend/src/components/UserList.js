// frontend/src/components/UserList.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserList.css';

function UserList({ setSelectedUser, onUserDeleted }) {
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (err) {
      console.error(err);
      setMessage('사용자 목록을 불러오는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newUserName.trim()) {
      setMessage('이름을 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users', { name: newUserName.trim() });
      setUsers([...users, response.data.user]);
      setNewUserName('');
      setMessage(response.data.message);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage('사용자 생성에 실패했습니다.');
      }
    }
  };

  const handleDeleteUser = async (user_id) => {
    if (!window.confirm('정말 이 사용자를 삭제하시겠습니까? 이 사용자가 생성한 모든 음악도 삭제됩니다.')) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/users/${user_id}`);
      setUsers(users.filter(user => user.user_id !== user_id));
      setMessage(response.data.message);
      if (onUserDeleted) {
        onUserDeleted();
      }
      // 선택된 사용자가 삭제되면 선택 해제
      if (setSelectedUser && users.find(user => user.user_id === user_id)) {
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setMessage(`삭제 실패: ${err.response.data.message}`);
      } else {
        setMessage('사용자 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <h2>사용자 관리</h2>
      {message && <p>{message}</p>}
      <div>
        <input
          type="text"
          placeholder="새 사용자 이름"
          value={newUserName}
          onChange={(e) => setNewUserName(e.target.value)}
        />
        <button onClick={handleCreateUser}>사용자 생성</button>
      </div>
      <ul>
        {users.map(user => (
          <li key={user.user_id}>
            <button onClick={() => setSelectedUser(user)}>{user.name}</button>
            <button className="delete-button" onClick={() => handleDeleteUser(user.user_id)}>삭제</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserList;
