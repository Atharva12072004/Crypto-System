import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Wallet, ArrowDown, ArrowUp, CreditCard, RefreshCw, DollarSign } from 'lucide-react';
import useCryptoStore from '@/store/cryptoStore';
import { cn } from '@/lib/utils';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// Define the payment form schema
const paymentFormSchema = z.object({
  cardNumber: z.string().min(16, "Card number must be at least 16 digits"),
  expiryDate: z.string().min(5, "Please enter a valid expiry date (MM/YY)"),
  cvv: z.string().min(3, "CVV must be at least 3 digits"),
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 100, {
    message: "Amount must be at least 100",
  }),
});

// Define TypeScript type from the zod schema
type PaymentFormValues = z.infer<typeof paymentFormSchema>;

const TransactionList = () => {
  const { wallet } = useCryptoStore();
  
  if (wallet.transactions.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No transactions yet</p>
      </div>
    );
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
      {wallet.transactions.map((transaction) => (
        <div 
          key={transaction.id} 
          className="transaction-item p-3 rounded-md bg-background/50 hover:bg-background/80"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {transaction.type === 'buy' ? (
                <ArrowDown className="w-4 h-4 mr-2 text-positive" />
              ) : (
                <ArrowUp className="w-4 h-4 mr-2 text-negative" />
              )}
              <div>
                <div className="font-medium">
                  {transaction.type === 'buy' ? 'Bought' : 'Sold'} {transaction.cryptocurrency.symbol.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(transaction.timestamp)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {transaction.amount} {transaction.cryptocurrency.symbol.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">
                @ {formatCurrency(transaction.price)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const WalletPanel = () => {
  const { wallet, selectedCrypto, buyCryptocurrency, sellCryptocurrency, depositToWallet } = useCryptoStore();
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      amount: '1000',
    },
  });

  const handleBuy = async () => {
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const success = await buyCryptocurrency(amount);
    if (success) {
      setBuyAmount('');
    }
  };
  
  const handleSell = async () => {
    const amount = parseFloat(sellAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    const success = await sellCryptocurrency(amount);
    if (success) {
      setSellAmount('');
    }
  };
  
  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    depositToWallet(amount);
    setDepositAmount('');
    setIsDepositDialogOpen(false);
  };

  const handlePaymentSubmit = (values: PaymentFormValues) => {
    setTimeout(() => {
      depositToWallet(parseFloat(values.amount));
      setIsPaymentDialogOpen(false);
      paymentForm.reset();
    }, 1000);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    paymentForm.setValue('cardNumber', value);
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = value.slice(0, 2) + '/' + value.slice(2);
    }
    paymentForm.setValue('expiryDate', value);
  };
  
  return (
    <Card className="h-full glassmorphism">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            <CardTitle>Your Wallet</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CreditCard className="w-4 h-4" />
                  <span>Recharge Wallet</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add funds with card payment</DialogTitle>
                  <DialogDescription>
                    Enter your card details to recharge your wallet.
                  </DialogDescription>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={paymentForm.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234 5678 9012 3456" 
                              {...field} 
                              onChange={handleCardNumberChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4">
                      <FormField
                        control={paymentForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>Expiry Date</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="MM/YY" 
                                {...field} 
                                onChange={handleExpiryDateChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paymentForm.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123" 
                                type="password" 
                                maxLength={4} 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="100" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        className="bg-positive hover:bg-positive/90 text-white"
                      >
                        Pay
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Deposit</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add funds to your wallet</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to deposit.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full"
                      min="0"
                      step="100"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="default"
                    onClick={handleDeposit}
                    disabled={!depositAmount || parseFloat(depositAmount) <= 0}
                  >
                    Add Funds
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 mt-2">
          <div className="text-muted-foreground text-sm">Available Balance</div>
          <div className="text-3xl font-bold">{formatCurrency(wallet.balance)}</div>
        </div>
        
        <Separator className="my-4" />
        
        {selectedCrypto ? (
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="w-full mb-4 bg-muted/40">
              <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
              <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
              <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Amount to Buy</div>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder={`Amount of ${selectedCrypto.symbol.toUpperCase()}`}
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="flex-1"
                    min="0"
                    step="0.001"
                  />
                  <Button
                    onClick={handleBuy}
                    disabled={!buyAmount || parseFloat(buyAmount) <= 0 || parseFloat(buyAmount) * selectedCrypto.current_price > wallet.balance}
                    className="bg-positive hover:bg-positive/90"
                  >
                    Buy
                  </Button>
                </div>
                {buyAmount && !isNaN(parseFloat(buyAmount)) && (
                  <div className="text-sm mt-2">
                    Total Cost: {formatCurrency(parseFloat(buyAmount) * selectedCrypto.current_price)}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>You are about to buy {selectedCrypto.name} ({selectedCrypto.symbol.toUpperCase()}) at the current market price.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Amount to Sell</div>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder={`Amount of ${selectedCrypto.symbol.toUpperCase()}`}
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="flex-1"
                    min="0"
                    step="0.001"
                  />
                  <Button
                    onClick={handleSell}
                    disabled={!sellAmount || parseFloat(sellAmount) <= 0}
                    className="bg-negative hover:bg-negative/90"
                  >
                    Sell
                  </Button>
                </div>
                {sellAmount && !isNaN(parseFloat(sellAmount)) && (
                  <div className="text-sm mt-2">
                    Total Value: {formatCurrency(parseFloat(sellAmount) * selectedCrypto.current_price)}
                  </div>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>You are about to sell {selectedCrypto.name} ({selectedCrypto.symbol.toUpperCase()}) at the current market price.</p>
              </div>
            </TabsContent>
            
            <TabsContent value="history">
              <TransactionList />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Select a cryptocurrency to trade</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletPanel;
