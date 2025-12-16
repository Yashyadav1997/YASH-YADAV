import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NewsCategory, NewsData, Alert } from './types';
import { fetchNewsSummary, fetchMarketMoverData, fetchSearchResults } from './services/geminiService';
import { CATEGORY_DETAILS, PROMPTS, NEWS_POLL_INTERVAL } from './constants';
import NewsCard from './components/NewsCard';
import NotificationToast from './components/NotificationToast';
import Search from './components/Search';
import CardSkeleton from './components/CardSkeleton';

type NewsState = Record<NewsCategory, NewsData>;
type MarketData = Record<string, { currentPrice: number }>;

const App: React.FC = () => {
  const [newsState, setNewsState] = useState<NewsState>({
    [NewsCategory.MarketMovers]: { content: '', sources: [], loading: true, error: null },
    [NewsCategory.GlobalMacro]: { content: '', sources: [], loading: true, error: null },
    [NewsCategory.IntradayPulse]: { content: '', sources: [], loading: true, error: null },
  });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(NEWS_POLL_INTERVAL);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({});
  
  // Search State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<NewsData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const lastNotifiedContent = useRef<Record<string, string | null>>({
    news: null,
    alert: null,
  });

  const fetchAllNews = useCallback(async (isPoll = false) => {
    if (!isPoll) {
        setIsRefreshing(true);
    }
    setNewsState(prevState => {
      const newState = { ...prevState };
      for (const key in newState) {
        const category = key as NewsCategory;
        newState[category] = { ...prevState[category], loading: true, error: null };
      }
      return newState;
    });

    const categories = Object.keys(PROMPTS) as NewsCategory[];

    // Stagger requests to avoid 429 Rate Limit errors
    const promises = categories.map(async (category, index) => {
      // Wait 1.5s between each request start
      await new Promise(resolve => setTimeout(resolve, index * 1500));

      if (category === NewsCategory.MarketMovers) {
        return fetchMarketMoverData(PROMPTS[category]);
      }
      return fetchNewsSummary(PROMPTS[category]);
    });

    const results = await Promise.allSettled(promises);

    const newMarketData: MarketData = {};

    setNewsState(prevState => {
      const newState = { ...prevState };
      results.forEach((result, index) => {
        const category = categories[index];
        if (result.status === 'fulfilled') {
          const data = result.value;
          newState[category] = {
            ...newState[category],
            ...data,
            loading: false,
            error: null,
          };
           if (data.stockTicker && data.chartData && data.chartData.length > 0) {
            newMarketData[data.stockTicker] = {
              currentPrice: data.chartData[data.chartData.length - 1].price,
            };
          }
           if (category === NewsCategory.IntradayPulse && data.content && data.content !== lastNotifiedContent.current.news && isPoll) {
             setNotification(`New Pulse: ${data.content}`);
             lastNotifiedContent.current.news = data.content;
           }
        } else {
          newState[category] = {
            ...newState[category],
            content: '',
            sources: [],
            loading: false,
            error: (result.reason as Error).message || 'An unknown error occurred.',
          };
        }
      });
      return newState;
    });
    
    setMarketData(prev => ({...prev, ...newMarketData}));
    if (!isPoll) {
        setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshInterval <= 0) return;

    const intervalId = setInterval(() => fetchAllNews(true), refreshInterval);
    
    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchAllNews]);

  useEffect(() => {
    const priceUpdateInterval = setInterval(() => {
        setMarketData(prevData => {
            const newData = { ...prevData };
            let alertTriggered = false;
            for (const ticker in newData) {
                const oldPrice = newData[ticker].currentPrice;
                const changePercent = (Math.random() - 0.5) * 0.01; // +/- 0.5%
                const newPrice = parseFloat((oldPrice * (1 + changePercent)).toFixed(2));
                newData[ticker].currentPrice = newPrice;

                alerts.forEach(alert => {
                    if (alert.ticker === ticker) {
                        const conditionMet = 
                            (alert.condition === 'above' && newPrice > alert.targetPrice) ||
                            (alert.condition === 'below' && newPrice < alert.targetPrice);
                        
                        if (conditionMet) {
                            const alertId = `${ticker}-${alert.condition}-${alert.targetPrice}`;
                            if(lastNotifiedContent.current.alert !== alertId) {
                                setNotification(`📈 Alert for ${ticker}: Price crossed ₹${alert.targetPrice} and is now ₹${newPrice}`);
                                lastNotifiedContent.current.alert = alertId;
                                alertTriggered = true;
                            }
                        }
                    }
                });
            }
            return newData;
        });
    }, 5000); // Simulate price ticks every 5 seconds

    return () => clearInterval(priceUpdateInterval);
  }, [alerts]);

  const handleSetAlert = (newAlert: Alert) => {
    setAlerts(prevAlerts => {
      const existingIndex = prevAlerts.findIndex(a => a.ticker === newAlert.ticker && a.condition === newAlert.condition);
      if (existingIndex > -1) {
        const updatedAlerts = [...prevAlerts];
        updatedAlerts[existingIndex] = newAlert;
        return updatedAlerts;
      }
      return [...prevAlerts, newAlert];
    });
    setNotification(`Alert set for ${newAlert.ticker} when price goes ${newAlert.condition} ₹${newAlert.targetPrice}`);
  };
  
  const handleRemoveAlert = (ticker: string, condition: 'above' | 'below') => {
    setAlerts(prev => prev.filter(a => !(a.ticker === ticker && a.condition === condition)));
  };

  const handleSearch = async (query: string) => {
    if (!query) return;
    setSearchQuery(query);
    setIsSearching(true);
    setSearchResult({ content: '', sources: [], loading: true, error: null }); // Set loading state for search result
    try {
      const result = await fetchSearchResults(query);
      const newMarketData: MarketData = {};
      if (result.stockTicker && result.chartData && result.chartData.length > 0) {
        newMarketData[result.stockTicker] = {
          currentPrice: result.chartData[result.chartData.length - 1].price,
        };
        setMarketData(prev => ({ ...prev, ...newMarketData }));
      }
      // FIX: Ensure the object passed to setSearchResult conforms to the NewsData type.
      // `fetchSearchResults` returns a Partial<NewsData>, so we provide defaults for required fields.
      setSearchResult({ content: '', sources: [], error: null, ...result, loading: false });
    } catch (error) {
      setSearchResult({
        content: '',
        sources: [],
        loading: false,
        error: (error as Error).message || 'Failed to fetch search results.',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };


  const REFRESH_OPTIONS = [
    { label: '5 Min', value: 300000 },
    { label: '10 Min', value: 600000 },
    { label: 'Manual', value: 0 },
  ];

  return (
    <div className="min-h-screen text-gray-100 font-sans p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#0a0f1f] to-[#10182c]">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-white/10 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              Real-Time Indian Financial News
            </h1>
            <p className="text-md text-gray-400">AI-Powered Market Insights</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
             <Search onSearch={handleSearch} onClear={handleClearSearch} isSearching={isSearching} />
            <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
                <span className="text-xs font-semibold text-gray-400 px-2">Refresh:</span>
                {REFRESH_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setRefreshInterval(opt.value)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 ${
                            refreshInterval === opt.value ? 'bg-cyan-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            <button
              onClick={() => fetchAllNews(false)}
              disabled={isRefreshing}
              className="flex items-center justify-center px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Now
                </>
              )}
            </button>
          </div>
        </header>

        {notification && (
          <NotificationToast
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}
        
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {searchResult && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <NewsCard
                      isSearchResult={true}
                      title={`Search Results for "${searchQuery}"`}
                      icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                      data={searchResult}
                      onSetAlert={handleSetAlert}
                      onRemoveAlert={handleRemoveAlert}
                      activeAlerts={alerts.filter(a => a.ticker === searchResult?.stockTicker)}
                      currentPrice={marketData[searchResult.stockTicker!]?.currentPrice}
                      onClose={handleClearSearch}
                    />
                </div>
            )}

            {(Object.keys(CATEGORY_DETAILS) as NewsCategory[]).map(category => (
                <NewsCard
                  key={category}
                  title={CATEGORY_DETAILS[category].title}
                  icon={CATEGORY_DETAILS[category].icon}
                  data={newsState[category]}
                  onSetAlert={handleSetAlert}
                  onRemoveAlert={handleRemoveAlert}
                  activeAlerts={alerts.filter(a => a.ticker === newsState[NewsCategory.MarketMovers]?.stockTicker)}
                  currentPrice={marketData[newsState[category].stockTicker!]?.currentPrice}
                />
            ))}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Google Gemini. Data is for informational purposes only and focused on the Indian market.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;