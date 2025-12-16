export enum NewsCategory {
  MarketMovers = 'MarketMovers',
  GlobalMacro = 'GlobalMacro',
  IntradayPulse = 'IntradayPulse',
}

export interface Source {
  uri: string;
  title: string;
}

export interface ChartDataPoint {
  date: string;
  price: number;
}

export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export interface NewsData {
  content: string;
  sources: Source[];
  loading: boolean;
  error: string | null;
  sentiment?: Sentiment;
  chartData?: ChartDataPoint[];
  stockTicker?: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Alert {
    ticker: string;
    targetPrice: number;
    condition: 'above' | 'below';
}
