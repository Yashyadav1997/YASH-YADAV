import React, { useState } from 'react';
import { ChartDataPoint } from '../types';

interface StockChartProps {
  data: ChartDataPoint[];
  ticker: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, ticker }) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  if (!data || data.length < 2) {
    return <p className="text-gray-500 text-sm">Not enough data for chart.</p>;
  }

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const priceChange = lastPrice - firstPrice;
  const percentChange = (priceChange / firstPrice) * 100;

  const prices = data.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const svgWidth = 300;
  const svgHeight = 150;
  const paddingX = 25;
  const paddingY = 20;

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (svgWidth - 2 * paddingX);
  };

  const getY = (price: number) => {
    if (priceRange <= 0) return svgHeight / 2;
    return (svgHeight - paddingY) - ((price - minPrice) / priceRange) * (svgHeight - 2 * paddingY);
  };

  const points = data.map((point, i) => `${getX(i)},${getY(point.price)}`).join(' ');
  const areaPath = `M ${getX(0)},${getY(data[0].price)} ` + points + ` L ${getX(data.length - 1)},${svgHeight - paddingY} L ${getX(0)},${svgHeight - paddingY} Z`;

  const isUp = lastPrice >= firstPrice;
  const strokeColor = isUp ? '#22c55e' : '#ef4444'; // green-500 or red-500
  const gradientId = isUp ? 'chart-gradient-up' : 'chart-gradient-down';

  return (
    <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/10">
      <div className="flex justify-between items-baseline mb-2">
        <h4 className="text-md font-semibold text-white">{ticker} - 7 Day</h4>
        <div className="text-right">
          <p className="text-lg font-bold text-white">₹{lastPrice.toFixed(2)}</p>
          <p className={`text-sm font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
             {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({percentChange.toFixed(2)}%)
          </p>
        </div>
      </div>
      <div className="w-full relative">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto"
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoveredIndex(null);
          }}
        >
          <defs>
            <linearGradient id="chart-gradient-up" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
            </linearGradient>
            <linearGradient id="chart-gradient-down" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
            </linearGradient>
          </defs>
          
          <text x={paddingX - 4} y={paddingY + 3} fill="#9ca3af" fontSize="10" textAnchor="end">
            ₹{maxPrice.toFixed(0)}
          </text>
          <text x={paddingX - 4} y={svgHeight - paddingY} fill="#9ca3af" fontSize="10" textAnchor="end">
            ₹{minPrice.toFixed(0)}
          </text>
          
           <text x={paddingX} y={svgHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="start">
            {data[0].date}
          </text>
           <text x={svgWidth - paddingX} y={svgHeight - 5} fill="#9ca3af" fontSize="10" textAnchor="end">
            {data[data.length - 1].date}
          </text>
          
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#4b5563" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#4b5563" strokeWidth="0.5" strokeDasharray="2,2" />

          <path d={areaPath} fill={`url(#${gradientId})`} />

          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          
          {data.map((point, i) => (
            <rect
              key={i}
              x={getX(i) - ((svgWidth - 2 * paddingX) / (data.length - 1) / 2)}
              y="0"
              width={(svgWidth - 2 * paddingX) / (data.length - 1)}
              height={svgHeight}
              fill="transparent"
              onMouseEnter={() => {
                setHoveredPoint(point);
                setHoveredIndex(i);
              }}
            />
          ))}

          {hoveredPoint && hoveredIndex !== null && (
            <g>
              <line x1={getX(hoveredIndex)} y1={paddingY} x2={getX(hoveredIndex)} y2={svgHeight - paddingY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="2,2" />
              <g transform={`translate(${getX(hoveredIndex)}, ${getY(hoveredPoint.price)})`}>
                <circle r="4" fill={strokeColor} stroke="white" strokeWidth="2" />
                <g transform={`translate(${getX(hoveredIndex) > svgWidth / 2 ? -45 : 10}, 0)`}>
                   <rect y="-15" width="70" height="30" rx="4" fill="rgba(17,24,39,0.8)" stroke="rgba(255,255,255,0.2)" />
                   <text y="-5" x="35" fill="white" fontSize="10" textAnchor="middle">
                     {hoveredPoint.date}
                   </text>
                   <text y="8" x="35" fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                     ₹{hoveredPoint.price.toFixed(2)}
                   </text>
                </g>
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

export default StockChart;
