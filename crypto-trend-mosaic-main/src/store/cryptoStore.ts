
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import cryptoAPI, { Cryptocurrency, HistoricalData, Transaction } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface WalletState {
  balance: number;
  transactions: Transaction[];
}

interface CryptoState {
  cryptocurrencies: Cryptocurrency[];
  selectedCrypto: Cryptocurrency | null;
  historicalData: HistoricalData | null;
  lastUpdate: string;
  isLoading: boolean;
  wallet: WalletState;
  error: string | null;
  
  // Actions
  fetchCryptocurrencies: () => Promise<void>;
  selectCryptocurrency: (id: string, days?: number) => Promise<void>;
  buyCryptocurrency: (amount: number) => Promise<boolean>;
  sellCryptocurrency: (amount: number) => Promise<boolean>;
  depositToWallet: (amount: number) => void;
}

const useCryptoStore = create<CryptoState>()(
  persist(
    (set, get) => ({
      cryptocurrencies: [],
      selectedCrypto: null,
      historicalData: null,
      lastUpdate: new Date().toISOString(),
      isLoading: false,
      wallet: {
        balance: 10000, // Initial balance
        transactions: [],
      },
      error: null,
      
      fetchCryptocurrencies: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await cryptoAPI.getCryptocurrencies();
          
          // Compare with existing data to set the priceChangeState
          const prevData = get().cryptocurrencies;
          const updatedData = data.map(crypto => {
            const prevCrypto = prevData.find(c => c.id === crypto.id);
            if (prevCrypto) {
              const priceChange = crypto.current_price - prevCrypto.current_price;
              if (Math.abs(priceChange) < 0.0001) {
                return { ...crypto, priceChangeState: 'neutral' as 'neutral' };
              }
              return { 
                ...crypto, 
                priceChangeState: (priceChange > 0 ? 'up' : 'down') as 'up' | 'down'
              };
            }
            return { ...crypto, priceChangeState: 'neutral' as 'neutral' };
          });
          
          set({ 
            cryptocurrencies: updatedData, 
            isLoading: false,
            lastUpdate: new Date().toISOString()
          });
        } catch (error) {
          console.error('Error fetching cryptocurrencies:', error);
          set({ 
            error: 'Failed to fetch cryptocurrencies', 
            isLoading: false 
          });
        }
      },
      
      selectCryptocurrency: async (id: string, days = 7) => {
        const { cryptocurrencies } = get();
        const crypto = cryptocurrencies.find(c => c.id === id);
        
        if (!crypto) {
          toast({
            title: "Error",
            description: "Cryptocurrency not found",
            variant: "destructive",
          });
          return;
        }
        
        set({ isLoading: true, selectedCrypto: crypto });
        
        try {
          const historicalData = await cryptoAPI.getHistoricalData(id, days);
          set({ historicalData, isLoading: false });
        } catch (error) {
          console.error('Error fetching historical data:', error);
          set({ 
            error: 'Failed to fetch historical data', 
            isLoading: false 
          });
        }
      },
      
      buyCryptocurrency: async (amount: number) => {
        const { wallet, selectedCrypto } = get();
        
        if (!selectedCrypto) {
          toast({
            title: "Error",
            description: "No cryptocurrency selected",
            variant: "destructive",
          });
          return false;
        }
        
        const totalCost = amount * selectedCrypto.current_price;
        
        if (totalCost > wallet.balance) {
          toast({
            title: "Insufficient funds",
            description: `You need $${totalCost.toFixed(2)} but only have $${wallet.balance.toFixed(2)}`,
            variant: "destructive",
          });
          return false;
        }
        
        const newTransaction: Transaction = {
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          cryptocurrency: selectedCrypto,
          amount,
          price: selectedCrypto.current_price,
          type: 'buy',
          timestamp: new Date().toISOString(),
        };
        
        set({
          wallet: {
            balance: wallet.balance - totalCost,
            transactions: [newTransaction, ...wallet.transactions],
          },
        });
        
        toast({
          title: "Transaction Successful",
          description: `Bought ${amount} ${selectedCrypto.symbol.toUpperCase()} for $${totalCost.toFixed(2)}`,
        });
        
        return true;
      },
      
      sellCryptocurrency: async (amount: number) => {
        const { wallet, selectedCrypto } = get();
        
        if (!selectedCrypto) {
          toast({
            title: "Error",
            description: "No cryptocurrency selected",
            variant: "destructive",
          });
          return false;
        }
        
        // Check if user owns enough of this crypto to sell
        const ownedAmount = wallet.transactions
          .filter(txn => 
            txn.cryptocurrency.id === selectedCrypto.id
          )
          .reduce((acc, txn) => {
            if (txn.type === 'buy') {
              return acc + txn.amount;
            } else {
              return acc - txn.amount;
            }
          }, 0);
        
        if (ownedAmount < amount) {
          toast({
            title: "Insufficient crypto balance",
            description: `You only have ${ownedAmount} ${selectedCrypto.symbol.toUpperCase()}`,
            variant: "destructive",
          });
          return false;
        }
        
        const totalValue = amount * selectedCrypto.current_price;
        
        const newTransaction: Transaction = {
          id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          cryptocurrency: selectedCrypto,
          amount,
          price: selectedCrypto.current_price,
          type: 'sell',
          timestamp: new Date().toISOString(),
        };
        
        set({
          wallet: {
            balance: wallet.balance + totalValue,
            transactions: [newTransaction, ...wallet.transactions],
          },
        });
        
        toast({
          title: "Transaction Successful",
          description: `Sold ${amount} ${selectedCrypto.symbol.toUpperCase()} for $${totalValue.toFixed(2)}`,
        });
        
        return true;
      },
      
      depositToWallet: (amount: number) => {
        const { wallet } = get();
        
        if (amount <= 0) {
          toast({
            title: "Invalid amount",
            description: "Deposit amount must be greater than zero",
            variant: "destructive",
          });
          return;
        }
        
        set({
          wallet: {
            ...wallet,
            balance: wallet.balance + amount,
          },
        });
        
        toast({
          title: "Deposit Successful",
          description: `$${amount.toFixed(2)} has been added to your wallet`,
        });
      },
    }),
    {
      name: 'crypto-store',
      partialize: (state) => ({ 
        wallet: state.wallet,
        selectedCrypto: state.selectedCrypto,
      }),
    }
  )
);

export default useCryptoStore;
