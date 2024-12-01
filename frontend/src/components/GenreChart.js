// frontend/src/components/GenreChart.js

import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend);

function GenreChart() {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchChartData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:5000/api/music');
      const musics = response.data;
      const genreCount = musics.reduce((acc, music) => {
        acc[music.genre] = (acc[music.genre] || 0) + 1;
        return acc;
      }, {});

      const data = {
        labels: Object.keys(genreCount),
        datasets: [
          {
            data: Object.values(genreCount),
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
            ],
            hoverBackgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
            ],
          },
        ],
      };

      setChartData(data);
    } catch (err) {
      console.error(err);
      setError('차트 데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return (
    <div>
      <h2>장르 비율</h2>
      {loading && <p>차트 로딩 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && Object.keys(chartData).length > 0 && (
        <Pie data={chartData} />
      )}
    </div>
  );
}

export default GenreChart;
