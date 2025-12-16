import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION, SEARCH_PROMPT } from '../constants';
import { Source, GroundingChunk, NewsData, ChartDataPoint, Sentiment } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const extractSources = (response: any): Source[] => {
    const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title:string } => web !== undefined && web.uri !== '' && web.title !== '')
      .reduce<Source[]>((acc, current) => {
        if (!acc.some(item => item.uri === current.uri)) {
          acc.push(current);
        }
        return acc;
      }, []);
}

const generateFakeStockData = (ticker: string): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    let price = Math.random() * 2000 + 500; // Start price between 500 and 2500

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        // Fluctuate price
        const changePercent = (Math.random() - 0.45) * 0.1; // -4.5% to +5.5% change
        price += price * changePercent;
        
        data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            price: parseFloat(price.toFixed(2)),
        });
    }
    return data;
};

const parseJsonResponse = (jsonText: string) => {
    const match = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    const cleanJson = match ? match[1] : jsonText;
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON response:", cleanJson, e);
        throw new Error("Invalid JSON format in API response.");
    }
};

const callGeminiApi = async (prompt: string, retries = 3): Promise<{ parsedData: any; sources: Source[] }> => {
    let lastError: any;
    
    for (let i = 0; i < retries; i++) {
        try {
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                tools: [{ googleSearch: {} }],
              },
            });
            
            const jsonText = response.text;
            if (!jsonText) throw new Error("Empty response from API.");

            const parsedData = parseJsonResponse(jsonText);
            const sources = extractSources(response);

            return { parsedData, sources };
        } catch (error: any) {
            lastError = error;
            
            // Determine if error is retryable
            const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
            const isServerError = error.status >= 500 || error.code >= 500;
            const isJsonError = error.message && error.message.includes('Invalid JSON');

            if (isRateLimit || isServerError || isJsonError) {
                if (i < retries - 1) {
                    // Exponential backoff with jitter: 2s, 4s, 8s + random jitter
                    const delay = Math.pow(2, i) * 2000 + Math.random() * 1000;
                    console.warn(`API call failed (Attempt ${i + 1}/${retries}). Retrying in ${Math.round(delay)}ms...`, error.message);
                    await wait(delay);
                    continue;
                }
            }
            
            // If not retryable or max retries reached, break loop
            break;
        }
    }
    throw lastError;
}


export const fetchNewsSummary = async (prompt: string): Promise<Partial<NewsData>> => {
  try {
    const { parsedData, sources } = await callGeminiApi(prompt);
    return { 
        content: parsedData.summary, 
        sentiment: parsedData.sentiment as Sentiment,
        sources 
    };
  } catch (error) {
    console.error("Error fetching news summary from Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch news summary. Reason: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching news summary.");
  }
};

export const fetchMarketMoverData = async (prompt: string): Promise<Partial<NewsData>> => {
    try {
        const { parsedData, sources } = await callGeminiApi(prompt);
        const stockTicker = parsedData.ticker;
        const chartData = generateFakeStockData(stockTicker);

        return {
            content: parsedData.summary,
            sentiment: parsedData.sentiment as Sentiment,
            stockTicker,
            chartData,
            sources,
        };

    } catch (error)        {
        console.error("Error fetching market mover data from Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to fetch market mover data. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred while fetching market mover data.");
    }
};

export const fetchSearchResults = async (query: string): Promise<Partial<NewsData>> => {
    try {
        const prompt = SEARCH_PROMPT(query);
        const { parsedData, sources } = await callGeminiApi(prompt);
        
        const result: Partial<NewsData> = {
            content: parsedData.summary,
            sentiment: parsedData.sentiment as Sentiment,
            sources,
        };

        if (parsedData.ticker) {
            result.stockTicker = parsedData.ticker;
            result.chartData = generateFakeStockData(parsedData.ticker);
        }
        
        return result;

    } catch (error) {
        console.error(`Error fetching search results for "${query}":`, error);
        if (error instanceof Error) {
            throw new Error(`Search failed. Reason: ${error.message}`);
        }
        throw new Error("An unknown error occurred during the search.");
    }
}