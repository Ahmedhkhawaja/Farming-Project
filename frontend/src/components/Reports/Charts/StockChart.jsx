import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

const StockChart = ({ summary }) => {
    if (!summary || summary.totalStock === 0) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                color: '#666',
                fontStyle: 'italic'
            }}>
                No stock data available
            </div>
        );
    }

    const availableStock = summary.totalStock - summary.stockSold - summary.stockReturned;

    const data = {
        labels: ['Available Stock', 'Stock Sold', 'Stock Returned'],
        datasets: [
            {
                data: [availableStock, summary.stockSold, summary.stockReturned],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1,
                hoverOffset: 15
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} units (${percentage}%)`;
                    }
                }
            }
        }
    };

    return <Doughnut data={data} options={options} />;
};

export default StockChart;