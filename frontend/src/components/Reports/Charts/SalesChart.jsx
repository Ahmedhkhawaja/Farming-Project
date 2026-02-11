import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SalesChart = ({ stocks }) => {

  // 🛑 SAFETY CHECK (THIS FIXES map error)
  if (!Array.isArray(stocks) || stocks.length === 0) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#777',
          fontStyle: 'italic'
        }}
      >
        No sales data available
      </div>
    );
  }

  const labels = stocks.map(stock =>
    stock.date
      ? new Date(stock.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      : ''
  );

  const data = {
    labels,
    datasets: [
      {
        label: 'Stock Sold',
        data: stocks.map(s => Number(s.stockSold || 0)),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Stock Returned',
        data: stocks.map(s => Number(s.stockReturned || 0)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: {
        display: true,
        text: 'Daily Sales Trend'
      }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return <Line data={data} options={options} />;
};

export default SalesChart;
