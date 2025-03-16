
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import useCryptoStore from '@/store/cryptoStore';
import { ArrowDown, ArrowUp, Sparkles, Wallet, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const CryptoCard = ({ crypto, onClick, isSelected }: { 
  crypto: any; 
  onClick: () => void;
  isSelected: boolean;
}) => {
  const [animateRefresh, setAnimateRefresh] = useState(false);

  useEffect(() => {
    if (crypto.priceChangeState) {
      setAnimateRefresh(true);
      const timer = setTimeout(() => setAnimateRefresh(false), 500);
      return () => clearTimeout(timer);
    }
  }, [crypto.current_price, crypto.priceChangeState]);

  const priceChangeClass = crypto.price_change_percentage_24h > 0 
    ? 'text-positive' 
    : crypto.price_change_percentage_24h < 0 
      ? 'text-negative' 
      : 'text-neutral-foreground';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card 
      className={cn(
        "crypto-card cursor-pointer transition-all duration-300 ease-in-out",
        "border border-border/40 hover:border-primary/40",
        "overflow-hidden glassmorphism",
        isSelected && "border-primary/80 shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center space-x-4">
        <div className="relative w-10 h-10 flex-shrink-0">
          <img 
            src={crypto.image} 
            alt={crypto.name} 
            className="w-full h-full object-contain rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://cryptoicons.org/api/icon/${crypto.symbol.toLowerCase()}/200`;
            }}
          />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div className="font-medium">{crypto.name}</div>
            <div className="text-xs uppercase text-muted-foreground">{crypto.symbol}</div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className={cn(
              "font-semibold transition-all duration-300",
              crypto.priceChangeState === 'up' && "price-up",
              crypto.priceChangeState === 'down' && "price-down",
            )}>
              {formatCurrency(crypto.current_price)}
              {animateRefresh && (
                <RefreshCw className="inline-block ml-1 w-3 h-3 animate-spin" />
              )}
            </div>
            
            <div className={cn("flex items-center text-xs", priceChangeClass)}>
              {crypto.price_change_percentage_24h > 0 ? (
                <ArrowUp className="w-3 h-3 mr-0.5" />
              ) : crypto.price_change_percentage_24h < 0 ? (
                <ArrowDown className="w-3 h-3 mr-0.5" />
              ) : null}
              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </div>
          </div>
          
          {crypto.sparkline_in_7d && (
            <div className="mt-2 h-8 w-full overflow-hidden">
              <svg viewBox="0 0 100 30" className="w-full h-full">
                <path
                  d={crypto.sparkline_in_7d.price.reduce((path: string, price: number, index: number, array: number[]) => {
                    const x = (index / (array.length - 1)) * 100;
                    const min = Math.min(...array);
                    const max = Math.max(...array);
                    const range = max - min;
                    const y = 30 - ((price - min) / range) * 30;
                    return `${path} ${index === 0 ? 'M' : 'L'} ${x},${y}`;
                  }, '')}
                  fill="none"
                  strokeWidth="1.5"
                  stroke={crypto.price_change_percentage_24h >= 0 ? "hsl(var(--positive))" : "hsl(var(--negative))"}
                />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CryptoCardSkeleton = () => (
  <Card className="crypto-card border border-border/40 overflow-hidden glassmorphism">
    <CardContent className="p-4 flex items-center space-x-4">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-grow">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="mt-2 h-8 w-full" />
      </div>
    </CardContent>
  </Card>
);

const CryptoCardList = () => {
  const { cryptocurrencies, isLoading, fetchCryptocurrencies, selectCryptocurrency, selectedCrypto } = useCryptoStore();

  useEffect(() => {
    fetchCryptocurrencies();
    
    // Set up polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchCryptocurrencies();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchCryptocurrencies]);

  if (isLoading && cryptocurrencies.length === 0) {
    return (
      <div className="space-y-3">
        {Array(8).fill(0).map((_, i) => (
          <CryptoCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 pr-3 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Cryptocurrencies</h2>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <RefreshCw className="w-3 h-3 mr-1" />
          <span>Updates every 10s</span>
        </div>
      </div>
      
      {cryptocurrencies.map(crypto => (
        <CryptoCard 
          key={crypto.id} 
          crypto={crypto} 
          onClick={() => selectCryptocurrency(crypto.id)}
          isSelected={selectedCrypto?.id === crypto.id}
        />
      ))}
    </div>
  );
};

export default CryptoCardList;
