
import { useEffect } from 'react';
import CryptoCardList from '@/components/CryptoCardList';
import CryptoChart from '@/components/CryptoChart';
import WalletPanel from '@/components/WalletPanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const Index = () => {
  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white">
      <div className="container mx-auto py-6 px-4 md:px-6">
        <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-block px-3 py-1 bg-[rgba(0,255,149,0.1)] text-[#00ff95] text-xs rounded-full mb-2">
              Real-time Trading Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Crypto Trend Mosaic</h1>
            <p className="text-gray-400 mt-1">Monitor, analyze, and trade cryptocurrencies in real-time</p>
          </div>
          
          <Alert className="max-w-md dark-glass">
            <AlertDescription className="text-sm">
              All prices update every 10 seconds. This is a simulated trading environment.
            </AlertDescription>
          </Alert>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden pr-2">
            <CryptoCardList />
          </div>
          
          <div className="lg:col-span-6">
            <div className="h-[calc(100vh-12rem)]">
              <CryptoChart />
            </div>
          </div>
          
          <div className="lg:col-span-3 h-[calc(100vh-12rem)]">
            <WalletPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
