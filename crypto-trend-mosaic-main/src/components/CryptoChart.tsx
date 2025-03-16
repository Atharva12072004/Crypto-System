
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import useCryptoStore from '@/store/cryptoStore';
import { ArrowDown, ArrowUp, Wallet, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const timeRanges = [
  { id: '1d', label: '1D', days: 1 },
  { id: '7d', label: '7D', days: 7 },
  { id: '30d', label: '1M', days: 30 },
  { id: '90d', label: '3M', days: 90 },
];

const CryptoChart = () => {
  const { selectedCrypto, historicalData, isLoading, selectCryptocurrency } = useCryptoStore();
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState<any[]>([]);

  // Fetch historical data when time range changes
  useEffect(() => {
    if (selectedCrypto) {
      const selectedRange = timeRanges.find(range => range.id === timeRange);
      if (selectedRange) {
        selectCryptocurrency(selectedCrypto.id, selectedRange.days);
      }
    }
  }, [timeRange, selectedCrypto?.id, selectCryptocurrency]);

  // Format data for the chart when historicalData changes
  useEffect(() => {
    if (historicalData?.prices) {
      const formattedData = historicalData.prices.map(([timestamp, price]) => ({
        timestamp,
        date: new Date(timestamp).toLocaleDateString(),
        time: new Date(timestamp).toLocaleTimeString(),
        price,
      }));
      
      setChartData(formattedData);
    }
  }, [historicalData]);

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedCrypto) {
        const selectedRange = timeRanges.find(range => range.id === timeRange);
        if (selectedRange) {
          selectCryptocurrency(selectedCrypto.id, selectedRange.days);
        }
      }
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [selectedCrypto, timeRange, selectCryptocurrency]);

  if (!selectedCrypto) {
    return (
      <Card className="h-full flex items-center justify-center dark-glass">
        <CardContent className="text-center p-6">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Select a Cryptocurrency</h3>
          <p className="text-muted-foreground">Click on a cryptocurrency from the list to view its chart and details</p>
        </CardContent>
      </Card>
    );
  }

  const priceChangeClass = selectedCrypto.price_change_percentage_24h > 0 
    ? 'text-green-500' 
    : selectedCrypto.price_change_percentage_24h < 0 
      ? 'text-red-500' 
      : 'text-neutral-foreground';

  const chartColor = selectedCrypto.price_change_percentage_24h >= 0 ? 
    ["#00ff9580", "#00ff9520"] : ["#ff009a80", "#ff009a20"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDateForTooltip = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <Card className="h-full overflow-hidden dark-glass hover-lift">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={selectedCrypto.image} 
              alt={selectedCrypto.name} 
              className="w-8 h-8 mr-2 rounded-full neon-glow"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://cryptoicons.org/api/icon/${selectedCrypto.symbol.toLowerCase()}/200`;
              }}
            />
            <div>
              <div className="flex items-center">
                <CardTitle className="text-xl">{selectedCrypto.name}</CardTitle>
                <span className="ml-2 text-sm uppercase text-muted-foreground">{selectedCrypto.symbol}</span>
              </div>
              <CardDescription className="flex items-center">
                Rank #{selectedCrypto.market_cap_rank} • Updated <RefreshCw className="inline w-3 h-3 mx-1 animate-spin-slow" /> every 10s
              </CardDescription>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-glow">
              {formatCurrency(selectedCrypto.current_price)}
            </div>
            <div className={cn("flex items-center justify-end text-sm", priceChangeClass)}>
              {selectedCrypto.price_change_percentage_24h > 0 ? (
                <ArrowUp className="w-4 h-4 mr-0.5" />
              ) : selectedCrypto.price_change_percentage_24h < 0 ? (
                <ArrowDown className="w-4 h-4 mr-0.5" />
              ) : null}
              {Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}% (24h)
            </div>
          </div>
        </div>
        
        <div className="flex justify-between mt-4 mb-2">
          <div className="dark-stat-card">
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="font-medium">{formatCurrencyCompact(selectedCrypto.market_cap)}</div>
          </div>
          <div className="dark-stat-card">
            <div className="text-sm text-muted-foreground">24h Trading Vol</div>
            <div className="font-medium">{formatCurrencyCompact(selectedCrypto.market_cap / 10)}</div>
          </div>
          <div className="dark-stat-card">
            <div className="text-sm text-muted-foreground">Circulating Supply</div>
            <div className="font-medium">{(selectedCrypto.market_cap / selectedCrypto.current_price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="7d" value={timeRange} onValueChange={setTimeRange} className="w-full">
          <TabsList className="mb-4 dark-tabs">
            {timeRanges.map(range => (
              <TabsTrigger key={range.id} value={range.id} className="flex-1 hover:text-glow transition-all duration-200">
                {range.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={timeRange} className="h-64">
            {isLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-full dark-skeleton" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor[0]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={chartColor[1]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(timestamp) => {
                      const date = new Date(timestamp);
                      return timeRange === '1d' 
                        ? date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                        : date.toLocaleDateString([], {month: 'short', day: 'numeric'});
                    }}
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                    tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.5)' }}
                    width={80}
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${formatCurrency(value)}`, 'Price']}
                    labelFormatter={formatDateForTooltip}
                    contentStyle={{ 
                      backgroundColor: '#111827', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={selectedCrypto.price_change_percentage_24h >= 0 ? "#00ff95" : "#ff009a"}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: 'white' }}
                    animationDuration={500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CryptoChart;
