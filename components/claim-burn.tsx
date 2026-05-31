import React, { useState, useEffect } from 'react';

type Mode = 'claim' | 'burn';
type Status = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

export type WalletState =
  | 'checking'
  | 'connecting'
  | 'notInstalled'
  | 'disconnected'
  | 'wrongNetwork'
  | 'connected'
  | 'error';

export interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  publicKey?: string | null;
  balance?: string | null;
  expectedNetwork?: string;
}

function isValidAmount(value: string): boolean {
  const n = Number(value);
  return value.trim() !== '' && !isNaN(n) && n > 0;
}

// ── Wallet state screens ──────────────────────────────────────────

function WalletStateScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-6 text-center">
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-violet-500 animate-spin" />
  );
}

// ── Main component ────────────────────────────────────────────────

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onSwitchNetwork,
  onDisconnect,
  onRefreshBalance,
  publicKey,
  balance,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => setStatus('idle'), 3000);
      return () => clearTimeout(t);
    }
  }, [status]);

  function resetFeedback() {
    setStatus('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleToggle(next: Mode) {
    setMode(next);
    resetFeedback();
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    if (status === 'error' || status === 'success') resetFeedback();
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAmount(amount)) return;
    setStatus('confirm');
  }

  async function handleConfirm() {
    setStatus('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      const action = mode === 'claim' ? onClaim : onBurn;
      const hash = await action?.(amount);
      if (hash) setTxHash(hash);
      setStatus('success');
      setAmount('');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  // ── Wallet state screens ────────────────────────────────────────

  if (walletState === 'checking' || walletState === 'connecting') {
    return (
      <WalletStateScreen data-testid="wallet-connecting">
        <div data-testid="wallet-connecting">
          <Spinner />
          <p className="mt-3 text-sm text-slate-500">Connecting to Freighter…</p>
        </div>
      </WalletStateScreen>
    );
  }

  if (walletState === 'notInstalled') {
    return (
      <WalletStateScreen>
        <div data-testid="wallet-not-installed">
          <span className="text-5xl">⚠️</span>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">Freighter Not Found</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Please install the{' '}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-600 hover:underline font-medium"
            >
              Freighter wallet extension
            </a>{' '}
            to continue.
          </p>
        </div>
      </WalletStateScreen>
    );
  }

  if (walletState === 'disconnected') {
    return (
      <WalletStateScreen>
        <div data-testid="wallet-disconnected" className="flex flex-col items-center gap-4">
          <span className="text-5xl">💼</span>
          <h3 className="text-lg font-semibold text-slate-900">Connect Your Wallet</h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            Connect your Freighter wallet to claim rewards or burn tokens.
          </p>
          {/* Blurred preview of the interface */}
          <div className="w-full max-w-xs rounded-xl border border-slate-200 p-4 blur-sm select-none pointer-events-none opacity-60">
            <div className="flex rounded-lg overflow-hidden border border-slate-200 mb-4">
              <div className="flex-1 py-2 text-center text-sm font-medium bg-violet-600 text-white">Claim</div>
              <div className="flex-1 py-2 text-center text-sm font-medium text-slate-500">Burn</div>
            </div>
            <div className="h-10 rounded-lg bg-slate-100 mb-3" />
            <div className="h-10 rounded-lg bg-emerald-500" />
          </div>
          <button
            onClick={onConnect}
            data-testid="connect-wallet-btn"
            className="w-full max-w-xs py-3 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Connect Wallet
          </button>
        </div>
      </WalletStateScreen>
    );
  }

  if (walletState === 'wrongNetwork') {
    return (
      <WalletStateScreen>
        <div data-testid="wallet-wrong-network" className="flex flex-col items-center gap-4">
          <span className="text-5xl">🌐</span>
          <h3 className="text-lg font-semibold text-slate-900">Wrong Network</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Please switch your Freighter wallet to{' '}
            <strong className="text-slate-700">{expectedNetwork}</strong>.
          </p>
          <button
            onClick={onSwitchNetwork}
            data-testid="switch-network-btn"
            className="w-full max-w-xs py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Switch to {expectedNetwork}
          </button>
        </div>
      </WalletStateScreen>
    );
  }

  if (walletState === 'error') {
    return (
      <WalletStateScreen>
        <div data-testid="wallet-error" className="flex flex-col items-center gap-4">
          <span className="text-5xl">⚠️</span>
          <h3 className="text-lg font-semibold text-slate-900">Connection Error</h3>
          <p className="text-sm text-slate-500">An error occurred while connecting to your wallet.</p>
          <button
            onClick={onConnect}
            data-testid="retry-connect-btn"
            className="w-full max-w-xs py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </WalletStateScreen>
    );
  }

  // ── Connected UI ────────────────────────────────────────────────

  const isPending = status === 'pending';
  const showConfirm = status === 'confirm';
  const valid = isValidAmount(amount);

  const actionColor =
    mode === 'claim'
      ? 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-emerald-200 focus:ring-emerald-400 disabled:bg-emerald-300'
      : 'bg-red-500 hover:bg-red-600 hover:shadow-red-200 focus:ring-red-400 disabled:bg-red-300';

  return (
    <div
      data-testid="claim-burn"
      className="w-full max-w-md mx-auto rounded-2xl bg-white shadow-md shadow-slate-100 border border-slate-100 p-6 font-sans"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-5">Claim &amp; Burn</h2>

      {/* Toggle */}
      <div
        role="group"
        aria-label="Select mode"
        className="flex rounded-xl overflow-hidden border border-slate-200 mb-5 bg-slate-50 p-1 gap-1"
      >
        {(['claim', 'burn'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleToggle(m)}
            aria-pressed={mode === m}
            data-testid={`toggle-${m}`}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 ${
              mode === m
                ? m === 'claim'
                  ? 'bg-white text-emerald-600 shadow-sm shadow-slate-200'
                  : 'bg-white text-red-500 shadow-sm shadow-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {m === 'claim' ? '✦ Claim' : '🔥 Burn'}
          </button>
        ))}
      </div>

      {/* Wallet info */}
      {publicKey && (
        <div
          data-testid="wallet-info"
          className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-5 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Connected</span>
            <span className="font-mono font-semibold text-slate-700">
              {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
            </span>
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                data-testid="disconnect-btn"
                className="ml-auto px-2 py-1 rounded-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors duration-150"
              >
                Disconnect
              </button>
            )}
          </div>
          {balance != null && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
              <span className="text-slate-400 font-medium">Balance</span>
              <span
                data-testid="wallet-balance"
                className="font-mono font-semibold text-emerald-600"
              >
                {balance} XLM
              </span>
              {onRefreshBalance && (
                <button
                  onClick={onRefreshBalance}
                  data-testid="refresh-balance-btn"
                  title="Refresh balance"
                  className="ml-auto text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ↻
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation overlay */}
      {showConfirm && (
        <div
          data-testid="confirm-overlay"
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 mb-4 text-center animate-[fadeIn_0.15s_ease]"
        >
          <p data-testid="confirm-text" className="text-sm font-semibold text-slate-800 mb-4">
            {mode === 'claim' ? 'Claim' : 'Burn'}{' '}
            <span className="text-violet-600">{amount} XLM</span>?
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('idle')}
              data-testid="cancel-btn"
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 text-sm font-semibold hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              data-testid="confirm-btn"
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${actionColor}`}
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleRequestSubmit} data-testid="claim-burn-form" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="amount-input" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Amount (XLM)
          </label>
          <div className="flex gap-2">
            <input
              id="amount-input"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              disabled={isPending}
              placeholder="0.00"
              data-testid="amount-input"
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-300 outline-none transition-all duration-150 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
            {mode === 'burn' && balance != null && (
              <button
                type="button"
                onClick={() => { setAmount(balance!); resetFeedback(); }}
                disabled={isPending}
                data-testid="max-btn"
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                MAX
              </button>
            )}
          </div>
        </div>

        {!showConfirm && (
          <button
            type="submit"
            disabled={isPending || !valid}
            data-testid="submit-btn"
            className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none ${actionColor}`}
          >
            {isPending
              ? mode === 'claim' ? 'Claiming…' : 'Burning…'
              : mode === 'claim' ? 'Claim Tokens' : 'Burn Tokens'}
          </button>
        )}
      </form>

      {/* Feedback */}
      {status === 'success' && (
        <p
          role="status"
          data-testid="success-msg"
          className="mt-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium text-center"
        >
          ✓ {mode === 'claim' ? 'XLM claimed successfully!' : 'XLM burned successfully!'}
          {txHash && (
            <span className="block mt-1 font-mono text-xs text-emerald-500 break-all">{txHash}</span>
          )}
        </p>
      )}
      {status === 'error' && (
        <p
          role="alert"
          data-testid="error-msg"
          className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center"
        >
          ✕ {errorMsg}
        </p>
      )}
    </div>
  );
}
