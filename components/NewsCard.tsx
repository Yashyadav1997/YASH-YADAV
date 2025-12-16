import React, { useState } from 'react';
import { NewsData, Sentiment, Alert } from '../types';
import StockChart from './StockChart';
import CardSkeleton from './CardSkeleton';

interface NewsCardProps {
  title: string;
  icon: React.JSX.Element;
  data: NewsData;
  onSetAlert: (alert: Alert) => void;
  onRemoveAlert: (ticker: string, condition: 'above' | 'below') => void;
  activeAlerts?: Alert[];
  currentPrice?: number;
  isSearchResult?: boolean;
  onClose?: () => void;
}

const SENTIMENT_STYLES: Record<Sentiment, { icon: string, color: string, label: string }> = {
    Positive: { icon: '▲', color: 'text-green-400 border-green-400/50 bg-green-900/30', label: 'Positive' },
    Negative: { icon: '▼', color: 'text-red-400 border-red-400/50 bg-red-900/30', label: 'Negative' },
    Neutral: { icon: '●', color: 'text-yellow-400 border-yellow-400/50 bg-yellow-900/30', label: 'Neutral' },
};

const AlertSetter: React.FC<{ 
    ticker: string; 
    onSetAlert: NewsCardProps['onSetAlert']; 
    onRemoveAlert: NewsCardProps['onRemoveAlert'];
    activeAlerts: NewsCardProps['activeAlerts'];
    currentPrice?: number;
}> = ({ ticker, onSetAlert, onRemoveAlert, activeAlerts, currentPrice }) => {
    const [targetPrice, setTargetPrice] = useState('');
    const [condition, setCondition] = useState<'above' | 'below'>('above');
    
    const activeAlert = activeAlerts?.find(a => a.condition === condition);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const price = parseFloat(targetPrice);
        if (ticker && !isNaN(price) && price > 0) {
            onSetAlert({ ticker, targetPrice: price, condition });
            setTargetPrice('');
        }
    };

    return (
        <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/10 text-sm">
            <h4 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l.293.293a1 1 0 001.414-1.414l-3-3z" clipRule="evenodd" /></svg>
                Set Price Alert
            </h4>
             {currentPrice && <p className="text-xs text-gray-400 mb-2">Current price: ~₹{currentPrice.toFixed(2)}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor={`condition-${ticker}`} className="sr-only">Condition</label>
                    <select id={`condition-${ticker}`} value={condition} onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-sm focus:ring-cyan-500 focus:border-cyan-500">
                        <option value="above">Price Above</option>
                        <option value="below">Price Below</option>
                    </select>
                </div>
                <div className="flex-grow w-full sm:w-auto">
                    <label htmlFor={`price-${ticker}`} className="sr-only">Target Price</label>
                    <input type="number" id={`price-${ticker}`} value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)}
                           placeholder="e.g. 1500" min="0" step="any"
                           className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-sm focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
                <button type="submit" className="w-full sm:w-auto px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white font-semibold rounded-md text-sm transition-colors">Set</button>
            </form>
             {activeAlert && (
                 <div className="mt-2 text-xs text-cyan-300 bg-cyan-900/50 p-2 rounded-md flex justify-between items-center">
                     <span>Alert active: {activeAlert.condition} ₹{activeAlert.targetPrice}</span>
                     <button onClick={() => onRemoveAlert(ticker, activeAlert.condition)} className="p-1 rounded-full hover:bg-cyan-800" aria-label="Remove alert">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                     </button>
                 </div>
            )}
        </div>
    );
};

const NewsCard: React.FC<NewsCardProps> = ({ title, icon, data, onSetAlert, onRemoveAlert, activeAlerts, currentPrice, isSearchResult = false, onClose }) => {
  const { loading, error, content, sources, chartData, stockTicker, sentiment } = data;

  const sentimentInfo = sentiment ? SENTIMENT_STYLES[sentiment] : null;

  return (
    <div className={`relative bg-white/5 backdrop-blur-md rounded-xl shadow-lg p-6 flex flex-col h-full border border-white/10 ${isSearchResult ? 'border-cyan-400/50' : 'hover:border-cyan-400/50 hover:scale-[1.02]'} transition-all duration-300`}>
       {isSearchResult && onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors z-10 p-1 rounded-full bg-black/20 hover:bg-black/50"
          aria-label="Close search results"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-cyan-400">
            <div className="p-2 bg-cyan-900/50 rounded-full">
              {icon}
            </div>
            <h2 className="text-xl font-bold ml-3 text-gray-100 truncate pr-8">{title}</h2>
        </div>
        {sentimentInfo && !loading && (
            <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full border ${sentimentInfo.color}`}>
                <span className="mr-1.5">{sentimentInfo.icon}</span> {sentimentInfo.label}
            </div>
        )}
      </div>
      <div className="flex-grow min-h-[250px] relative">
        {loading && <CardSkeleton />}
        {error && <p className="text-red-400 text-center my-auto flex items-center justify-center h-full">{error}</p>}
        {!loading && !error && content && (
          <div className="text-gray-300 space-y-4">
            <p className="leading-relaxed">{content}</p>

            {chartData && stockTicker && (
              <>
                <StockChart data={chartData} ticker={stockTicker} />
                <AlertSetter ticker={stockTicker} onSetAlert={onSetAlert} onRemoveAlert={onRemoveAlert} activeAlerts={activeAlerts} currentPrice={currentPrice} />
              </>
            )}

            {sources && sources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2 mt-4">Sources:</h3>
                <ul className="list-none space-y-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                  {sources.map((source, index) => (
                    <li key={index} className="truncate flex items-center">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-2 text-cyan-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-500 hover:text-cyan-300 hover:underline text-sm"
                        title={source.title}
                      >
                        {source.title || new URL(source.uri).hostname}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;