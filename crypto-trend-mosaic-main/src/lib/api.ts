
import { toast } from "@/hooks/use-toast";

export interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: {
    price: number[];
  };
  last_updated: string;
  priceChangeState?: 'up' | 'down' | 'neutral';
}

export interface HistoricalData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface Transaction {
  id: string;
  cryptocurrency: Cryptocurrency;
  amount: number;
  price: number;
  type: 'buy' | 'sell';
  timestamp: string;
}

const generateMockHistoricalData = (
  basePrice: number,
  days: number
): HistoricalData => {
  const prices: [number, number][] = [];
  const market_caps: [number, number][] = [];
  const total_volumes: [number, number][] = [];
  
  const now = Date.now();
  let dayInMs = 24 * 60 * 60 * 1000;
  
  // Adjust interval based on timeframe for more detailed charts
  if (days <= 1) {
    dayInMs = 5 * 60 * 1000; // 5-minute intervals for 1-day chart
  } else if (days <= 7) {
    dayInMs = 60 * 60 * 1000; // 1-hour intervals for 7-day chart
  } else if (days <= 30) {
    dayInMs = 6 * 60 * 60 * 1000; // 6-hour intervals for 30-day chart
  }
  
  const intervals = days <= 1 ? 24 * 12 : days * 8; // More data points for shorter timeframes
  
  // Reduce volatility for smoother graphs with less drastic changes
  const volatility = days <= 1 ? 0.002 : days <= 7 ? 0.005 : days <= 30 ? 0.01 : 0.02;
  
  // Create trend-based price movements with reduced randomness
  let lastPrice = basePrice;
  let trend = Math.random() > 0.5 ? 1 : -1;
  let trendStrength = Math.random() * 0.7 + 0.3; // How strong the trend is (0.3-1.0)
  let trendDuration = Math.floor(Math.random() * (intervals / 3)) + 5; // How long the trend lasts
  
  for (let i = intervals; i >= 0; i--) {
    const timestamp = now - i * dayInMs;
    
    // Change trend occasionally
    if (trendDuration <= 0) {
      trend = trend * -1; // Reverse trend
      trendStrength = Math.random() * 0.7 + 0.3;
      trendDuration = Math.floor(Math.random() * (intervals / 4)) + 5;
    }
    
    // Create smoother price movement with less volatility
    const trendFactor = trend * trendStrength * volatility;
    const randomNoise = (Math.random() - 0.5) * volatility * 0.3; // Reduced random noise
    lastPrice = lastPrice * (1 + trendFactor + randomNoise);
    
    prices.push([timestamp, lastPrice]);
    market_caps.push([timestamp, lastPrice * 1000000000]);
    total_volumes.push([timestamp, lastPrice * 100000000 * (0.7 + Math.random() * 0.3)]);
    
    trendDuration--;
  }
  
  return { prices, market_caps, total_volumes };
};

class CryptoAPI {
  private API_BASE_URL = "https://api.coingecko.com/api/v3";
  
  public async getCryptocurrencies(
    page = 1, 
    perPage = 15, 
    sparkline = true
  ): Promise<Cryptocurrency[]> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch cryptocurrencies");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching cryptocurrencies:", error);
      // Silently fallback to mock data without error toast
      return this.getMockCryptocurrencies();
    }
  }
  
  public async getHistoricalData(
    coinId: string, 
    days = 7
  ): Promise<HistoricalData> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch historical data");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      // Silently fallback to simulated data without error toast
      const basePrice = this.getMockPrice(coinId);
      return generateMockHistoricalData(basePrice, days);
    }
  }
  
  private getMockPrice(coinId: string): number {
    const hash = coinId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 50000) + 1000;
  }
  
  private getMockCryptocurrencies(): Cryptocurrency[] {
    const mockCoins = [
      { id: "bitcoin", symbol: "btc", name: "Bitcoin" },
      { id: "ethereum", symbol: "eth", name: "Ethereum" },
      { id: "binancecoin", symbol: "bnb", name: "Binance Coin" },
      { id: "ripple", symbol: "xrp", name: "XRP" },
      { id: "cardano", symbol: "ada", name: "Cardano" },
      { id: "solana", symbol: "sol", name: "Solana" },
      { id: "polkadot", symbol: "dot", name: "Polkadot" },
      { id: "dogecoin", symbol: "doge", name: "Dogecoin" },
      { id: "avalanche-2", symbol: "avax", name: "Avalanche" },
      { id: "chainlink", symbol: "link", name: "Chainlink" },
      { id: "litecoin", symbol: "ltc", name: "Litecoin" },
      { id: "polygon", symbol: "matic", name: "Polygon" },
      { id: "stellar", symbol: "xlm", name: "Stellar" },
      { id: "cosmos", symbol: "atom", name: "Cosmos" },
      { id: "uniswap", symbol: "uni", name: "Uniswap" },
    ];
    
    return mockCoins.map((coin, index) => {
      const basePrice = this.getMockPrice(coin.id);
      const percentChange = (Math.random() * 6) - 3; // Lower percentage change (-3% to +3%)
      
      return {
        ...coin,
        image: `https://cryptologos.cc/logos/${coin.id}-${coin.symbol}-logo.png?v=024`,
        current_price: basePrice,
        market_cap: basePrice * 1000000 * (Math.random() * 100 + 1),
        market_cap_rank: index + 1,
        price_change_percentage_24h: percentChange,
        price_change_percentage_7d_in_currency: percentChange * 1.5,
        sparkline_in_7d: {
          price: Array(25).fill(0).map(() => basePrice * (0.95 + Math.random() * 0.1))
        },
        last_updated: new Date().toISOString(),
      };
    });
  }
}

const cryptoAPI = new CryptoAPI();
export default cryptoAPI;
