// frontend/src/components/GenreChart.js

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import './GenreChart.css';

// Chart.js 요소 등록
Chart.register(ArcElement, Tooltip, Legend);

const GenreChart = React.memo(({ genreData }) => { // React.memo 사용
  const hasData = genreData && genreData.length > 0;

  const pieData = {
    labels: hasData ? genreData.map(item => item.genre) : ['No Music'],
    datasets: [{
      data: hasData ? genreData.map(item => item.count) : [1],
      backgroundColor: hasData ? [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#8A2BE2',
        '#00FA9A',
        '#FF7F50',
        '#6495ED',
        '#FF1493',
        '#7B68EE',
        '#00CED1'
      ] : ['#CCCCCC'],
      hoverBackgroundColor: hasData ? [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#8A2BE2',
        '#00FA9A',
        '#FF7F50',
        '#6495ED',
        '#FF1493',
        '#7B68EE',
        '#00CED1'
      ] : ['#CCCCCC']
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: hasData,
        position: 'bottom',
      },
      tooltip: {
        enabled: hasData,
      },
    },
  };

  return (
    <div className="genre-chart">
      <h3>장르 분포</h3>
      <Pie data={pieData} options={options} />
      {!hasData && <p className="no-music-label">음악 없음</p>}
    </div>
  );
});

export default GenreChart;
