'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent, ModalHeader } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useSwap, useModal, useForm } from '@/lib/hooks';
import { useTokens, useSwapSettings, useUser } from '@/lib/context';
import { Token, SwapSettings } from '@/lib/types';
import { TOKEN_CONFIG, SWAP_CONFIG } from '@/lib/constants';
import { formatCurrency, calculatePercentage } from '@/lib/utils';

export default function SwapPage(): JSX.Element {
  const { tokens, setTokens } = useTokens();
  const { settings, updateSettings } = useSwapSettings();
  const { isWalletConnected } = useUser();

  const {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    setFromToken,
    setToToken,
    setFromAmount,
    setToAmount,
    setSlippage,
    swapTokens,
    resetSwap,
  } = useSwap();

  const settingsModal = useModal();
  const fromTokenModal = useModal();
  const toTokenModal = useModal();

  // Initialize tokens from config
  useEffect(() => {
    if (tokens.length === 0) {
      const initialTokens: Token[] = [
        {
          symbol: TOKEN_CONFIG.USDC.symbol,
          name: TOKEN_CONFIG.USDC.name,
          icon: TOKEN_CONFIG.USDC.icon,
          balance: '1,250.00',
          address: TOKEN_CONFIG.USDC.address,
          decimals: TOKEN_CONFIG.USDC.decimals,
          priceUSD: 1,
        },
        {
          symbol: TOKEN_CONFIG.ECO.symbol,
          name: TOKEN_CONFIG.ECO.name,
          icon: TOKEN_CONFIG.ECO.icon,
          balance: '0',
          address: TOKEN_CONFIG.ECO.address,
          decimals: TOKEN_CONFIG.ECO.decimals,
          priceUSD: 0.4,
        },
        {
          symbol: TOKEN_CONFIG.ETH.symbol,
          name: TOKEN_CONFIG.ETH.name,
          icon: TOKEN_CONFIG.ETH.icon,
          balance: '2.5',
          address: TOKEN_CONFIG.ETH.address,
          decimals: TOKEN_CONFIG.ETH.decimals,
          priceUSD: 2000,
        },
      ];
      setTokens(initialTokens);

      if (!fromToken) setFromToken(initialTokens[0]);
      if (!toToken) setToToken(initialTokens[1]);
    }
  }, [tokens, setTokens, fromToken, toToken, setFromToken, setToToken]);

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    // Calculate to amount based on exchange rate
    const amount = parseFloat(value) || 0;
    if (fromToken && toToken) {
      const rate = (toToken.priceUSD || 0) / (fromToken.priceUSD || 1);
      setToAmount((amount * rate).toFixed(6));
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    // Calculate from amount based on exchange rate
    const amount = parseFloat(value) || 0;
    if (fromToken && toToken) {
      const rate = (fromToken.priceUSD || 1) / (toToken.priceUSD || 1);
      setFromAmount((amount * rate).toFixed(6));
    }
  };

  const TokenSelector = ({
    isOpen,
    onClose,
    onSelect,
    currentToken,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: Token) => void;
    currentToken: Token | null;
  }) => {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size='md'>
        <ModalHeader onClose={onClose}>
          <h3 className='text-lg font-semibold'>Select Token</h3>
        </ModalHeader>
        <ModalContent>
          <div className='space-y-2'>
            {tokens.map(token => (
              <button
                key={token.symbol}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${
                  token.symbol === currentToken?.symbol
                    ? 'bg-blue-50 border border-blue-200'
                    : ''
                }`}
              >
                <div className='flex items-center space-x-3'>
                  {token.icon.startsWith('http') ? (
                    <img
                      src={token.icon}
                      alt={token.symbol}
                      className='w-8 h-8'
                    />
                  ) : (
                    <div className='w-8 h-8 flex items-center justify-center text-2xl'>
                      {token.icon}
                    </div>
                  )}
                  <div className='text-left'>
                    <div className='font-semibold'>{token.symbol}</div>
                    <div className='text-sm text-gray-500'>{token.name}</div>
                  </div>
                </div>
                <div className='text-right'>
                  <div className='font-semibold'>{token.balance}</div>
                </div>
              </button>
            ))}
          </div>
        </ModalContent>
      </Modal>
    );
  };

  const SettingsModal = () => {
    const settingsForm = useForm({
      slippageTolerance: settings.slippageTolerance,
      transactionDeadline: settings.transactionDeadline,
      autoRefresh: settings.autoRefresh,
    });

    const handleSaveSettings = () => {
      updateSettings({
        slippageTolerance: settingsForm.values.slippageTolerance,
        transactionDeadline: settingsForm.values.transactionDeadline,
        autoRefresh: settingsForm.values.autoRefresh,
      });
      settingsModal.close();
    };

    return (
      <Modal
        isOpen={settingsModal.isOpen}
        onClose={settingsModal.close}
        size='md'
      >
        <ModalHeader onClose={settingsModal.close}>
          <h3 className='text-lg font-semibold'>Transaction Settings</h3>
        </ModalHeader>
        <ModalContent>
          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Slippage Tolerance
              </label>
              <div className='flex space-x-2'>
                {[0.1, 0.5, 1.0].map(value => (
                  <Button
                    key={value}
                    onClick={() =>
                      settingsForm.setValue('slippageTolerance', value)
                    }
                    variant={
                      settingsForm.values.slippageTolerance === value
                        ? 'primary'
                        : 'outline'
                    }
                    size='sm'
                  >
                    {value}%
                  </Button>
                ))}
              </div>
              <div className='mt-2'>
                <Input
                  type='number'
                  value={settingsForm.values.slippageTolerance}
                  onChange={e =>
                    settingsForm.setValue(
                      'slippageTolerance',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder='Custom'
                  min={SWAP_CONFIG.minSlippage}
                  max={SWAP_CONFIG.maxSlippage}
                  step={0.1}
                />
              </div>
            </div>
            <div>
              <Input
                label='Transaction Deadline'
                type='number'
                value={settingsForm.values.transactionDeadline}
                onChange={e =>
                  settingsForm.setValue(
                    'transactionDeadline',
                    parseInt(e.target.value) || 20
                  )
                }
                placeholder='20'
                min={SWAP_CONFIG.minDeadline}
                max={SWAP_CONFIG.maxDeadline}
                helperText='minutes'
              />
            </div>
            <div className='flex items-center justify-between'>
              <label className='text-sm font-medium text-gray-700'>
                Auto-refresh quotes
              </label>
              <input
                type='checkbox'
                checked={settingsForm.values.autoRefresh}
                onChange={e =>
                  settingsForm.setValue('autoRefresh', e.target.checked)
                }
                className='rounded border-gray-300'
              />
            </div>
          </div>
          <div className='mt-6 flex space-x-3'>
            <Button
              onClick={settingsModal.close}
              variant='outline'
              className='flex-1'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSettings}
              variant='primary'
              className='flex-1'
            >
              Save Settings
            </Button>
          </div>
        </ModalContent>
      </Modal>
    );
  };

  const priceImpact = fromToken && toToken ? 0.01 : 0;
  const minimumReceived = toAmount
    ? (parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)
    : '0.00';
  const networkFee = '~$0.50';

  return (
    <main className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            Trade Carbon Credits
          </h1>
          <p className='text-lg text-gray-600'>
            Swap tokens instantly with the best rates
          </p>
        </div>

        <div className='flex justify-center'>
          <div className='w-full max-w-md'>
            <Card
              variant='elevated'
              padding='lg'
              className='bg-white/80 backdrop-blur-sm border-0 shadow-2xl'
            >
              <CardHeader>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle className='text-2xl font-bold text-gray-900'>
                      Trade
                    </CardTitle>
                    <p className='text-sm text-gray-500 mt-1'>
                      Exchange tokens seamlessly
                    </p>
                  </div>
                  <Button
                    onClick={settingsModal.open}
                    variant='ghost'
                    size='sm'
                    className='hover:bg-emerald-50 hover:text-emerald-600 transition-colors'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0l1.83 7.508a2.5 2.5 0 01-2.35 3.175H9.5a2.5 2.5 0 01-2.35-3.175l1.83-7.508z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  </Button>
                </div>
              </CardHeader>

              <CardContent>
                <div className='space-y-4'>
                  {/* From Token */}
                  <div className='bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100'>
                    <div className='flex items-center justify-between mb-3'>
                      <span className='text-sm font-medium text-emerald-700'>
                        From
                      </span>
                      <span className='text-sm text-emerald-600 font-medium'>
                        Balance: {fromToken?.balance || '0'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Input
                        type='number'
                        value={fromAmount}
                        onChange={e => handleFromAmountChange(e.target.value)}
                        placeholder='0.0'
                        className='bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 shadow-none focus:ring-0'
                      />
                      <Button
                        onClick={fromTokenModal.open}
                        variant='outline'
                        className='flex items-center space-x-3 bg-white/80 hover:bg-white border-emerald-200 hover:border-emerald-300 transition-all duration-200'
                      >
                        {fromToken?.icon.startsWith('http') ? (
                          <img
                            src={fromToken.icon}
                            alt={fromToken.symbol}
                            className='w-7 h-7'
                          />
                        ) : (
                          <div className='w-7 h-7 flex items-center justify-center text-xl'>
                            {fromToken?.icon}
                          </div>
                        )}
                        <span className='font-bold text-gray-900'>
                          {fromToken?.symbol}
                        </span>
                        <svg
                          className='w-4 h-4 text-emerald-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Swap Button */}
                  <div className='flex justify-center -my-2'>
                    <Button
                      onClick={swapTokens}
                      variant='ghost'
                      size='sm'
                      className='w-12 h-12 rounded-full bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:scale-105'
                    >
                      <svg
                        className='w-6 h-6 text-emerald-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4'
                        />
                      </svg>
                    </Button>
                  </div>

                  {/* To Token */}
                  <div className='bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-teal-100'>
                    <div className='flex items-center justify-between mb-3'>
                      <span className='text-sm font-medium text-teal-700'>
                        To
                      </span>
                      <span className='text-sm text-teal-600 font-medium'>
                        Balance: {toToken?.balance || '0'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <Input
                        type='number'
                        value={toAmount}
                        onChange={e => handleToAmountChange(e.target.value)}
                        placeholder='0.0'
                        className='bg-transparent text-3xl font-bold text-gray-900 placeholder-gray-400 border-0 shadow-none focus:ring-0'
                      />
                      <Button
                        onClick={toTokenModal.open}
                        variant='outline'
                        className='flex items-center space-x-3 bg-white/80 hover:bg-white border-teal-200 hover:border-teal-300 transition-all duration-200'
                      >
                        {toToken?.icon.startsWith('http') ? (
                          <img
                            src={toToken.icon}
                            alt={toToken.symbol}
                            className='w-7 h-7'
                          />
                        ) : (
                          <div className='w-7 h-7 flex items-center justify-center text-xl'>
                            {toToken?.icon}
                          </div>
                        )}
                        <span className='font-bold text-gray-900'>
                          {toToken?.symbol}
                        </span>
                        <svg
                          className='w-4 h-4 text-teal-500'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M19 9l-7 7-7-7'
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>

                  {/* Swap Details */}
                  {fromAmount && toAmount && fromToken && toToken && (
                    <div className='bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-5 space-y-4 border border-gray-200'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-gray-600'>
                          Exchange Rate
                        </span>
                        <span className='text-sm font-bold text-gray-900'>
                          1 {fromToken.symbol} ={' '}
                          {(
                            (toToken.priceUSD || 0) / (fromToken.priceUSD || 1)
                          ).toFixed(6)}{' '}
                          {toToken.symbol}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-gray-600'>
                          Price Impact
                        </span>
                        <Badge
                          variant={
                            priceImpact > 5
                              ? 'error'
                              : priceImpact > 1
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {priceImpact}%
                        </Badge>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-gray-600'>
                          Minimum Received
                        </span>
                        <span className='text-sm font-bold text-gray-900'>
                          {minimumReceived} {toToken.symbol}
                        </span>
                      </div>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium text-gray-600'>
                          Network Fee
                        </span>
                        <span className='text-sm font-bold text-gray-900'>
                          {networkFee}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Swap Button */}
                  <Button
                    variant='primary'
                    size='xl'
                    className='w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]'
                    disabled={!isWalletConnected || !fromAmount || !toAmount}
                  >
                    {!isWalletConnected
                      ? 'Connect Wallet'
                      : !fromAmount
                        ? 'Enter an amount'
                        : `Swap ${fromToken?.symbol} for ${toToken?.symbol}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TokenSelector
        isOpen={fromTokenModal.isOpen}
        onClose={fromTokenModal.close}
        onSelect={setFromToken}
        currentToken={fromToken}
      />

      <TokenSelector
        isOpen={toTokenModal.isOpen}
        onClose={toTokenModal.close}
        onSelect={setToToken}
        currentToken={toToken}
      />

      <SettingsModal />
    </main>
  );
}
