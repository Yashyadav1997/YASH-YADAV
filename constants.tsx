import React from 'react';
import { NewsCategory } from './types';

export const SYSTEM_INSTRUCTION = "You are a senior financial analyst specializing in the Indian market. Provide an unbiased, single-paragraph summary of the most impactful and very latest news. Focus on events within the last 24 hours relevant to India. Always provide your response as a valid JSON object. Do not use double quotes within the content strings; use single quotes instead to ensure valid JSON format.";

export const NEWS_POLL_INTERVAL = 300000; // 5 minutes

export const PROMPTS: Record<NewsCategory, string> = {
  [NewsCategory.MarketMovers]: "Summarize the latest, most significant news regarding the Indian stock market (NSE/BSE). Identify the single most significant stock mover and provide its NSE or BSE ticker symbol. Return this as a JSON object with three keys: 'summary' (your text summary), 'ticker' (the stock symbol as a string, e.g., 'RELIANCE.NS'), and 'sentiment' ('Positive', 'Negative', or 'Neutral').",
  [NewsCategory.GlobalMacro]: "Summarize the most impactful global and Indian domestic news affecting India's financial markets, including recent RBI decisions, government policy changes, geopolitical developments impacting India, and significant commodity price shifts. Return this as a JSON object with two keys: 'summary' (your text summary) and 'sentiment' ('Positive', 'Negative', or 'Neutral').",
  [NewsCategory.IntradayPulse]: "Provide a concise summary of the top trending news stories and fastest-moving assets on the Indian market (stocks, derivatives, commodities) right now, capturing the immediate market sentiment in India. Return this as a JSON object with two keys: 'summary' (your text summary) and 'sentiment' ('Positive', 'Negative', or 'Neutral').",
};

export const SEARCH_PROMPT = (query: string) => `
  User is searching for: "${query}".
  Analyze the query. Determine if it's an Indian stock ticker (e.g., 'TCS.NS', 'RELIANCE.BSE') or a general news topic.

  1.  **If it is a stock ticker:** Provide a concise summary of the most recent, impactful news specifically for that stock. Include its performance, any recent announcements, and market sentiment.
  2.  **If it is a news topic:** Provide a concise summary of the latest developments regarding that topic, focusing on its impact on the Indian financial markets.

  **CRITICAL:** Respond with a JSON object with the following structure:
  - 'summary': (string) Your detailed summary. Use single quotes instead of double quotes within the text.
  - 'sentiment': (string) 'Positive', 'Negative', or 'Neutral'.
  - 'ticker': (string, optional) If a specific stock was identified, include its ticker symbol here. Otherwise, omit this key.
`;

// Fix: Use React.JSX.Element to explicitly reference the type from the imported React module.
export const CATEGORY_DETAILS: Record<NewsCategory, { title: string; icon: React.JSX.Element }> = {
  [NewsCategory.MarketMovers]: {
    title: 'Indian Market Movers',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  [NewsCategory.GlobalMacro]: {
    title: 'Macro Economy (India)',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.737 16.95l.707.707a1 1 0 001.414 0l.707-.707M11 20.95v-3.83m4 3.83v-3.83M3.055 11A9.001 9.001 0 0112 3c4.97 0 9 4.03 9 9v1h-18v-1z" />
      </svg>
    ),
  },
  [NewsCategory.IntradayPulse]: {
    title: 'India Intraday Pulse',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
};