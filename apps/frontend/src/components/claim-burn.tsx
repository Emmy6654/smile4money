import React, { useState, useMemo } from 'react';
import type { WalletState, Mode } from '../types';

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefreshBalance?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
}

type SubmitPhase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

const STROOP_DECIMALS = 7;

function formatAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function parseDecimalCount(val: string): number {
  const dot = val.indexOf('.');
  return dot === -1 ? 0 : val.length - dot - 1;
}

function stripTrailingZeros(val: string): string {
  if (!val.includes('.')) return val;
  return val.replace(/\.?0+$/, '');
}

function isDisabledKey(key: string): boolean {
  return key === 'e' || key === 'E' || key === '+' || key === '-';
}

function isValidAmount(val: string): boolean {
  if (val === '' || val === '.') return false;
  const n = Number(val);
  if (Number.isNaN(n) || n <= 0) return false;
  if (parseDecimalCount(val) > STROOP_DECIMALS) return false;
  return true;
}

function formatNetwork(net: string): string {
  if (net === 'testnet') return 'Testnet';
  if (net === 'mainnet') return 'Mainnet';
  return 'Unknown';
}

export function ClaimBurn({
  walletState,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onClaim,
  onBurn,
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const balanceNum = useMemo(
    () => (walletState.balance !== null ? Number(walletState.balance) : null),
    [walletState.balance],
  );

  const exceedsBalance = useMemo(
    () =>
      mode === 'burn' &&
      balanceNum !== null &&
      isValidAmount(amount) &&
      Number(amount) > balanceNum,
    [amount, balanceNum, mode],
  );

  const valid = isValidAmount(amount) && !exceedsBalance;

  function resetFeedback() {
    setPhase('idle');
    setTxHash(null);
    setErrorMsg('');
  }

  function handleMax() {
    if (walletState.balance !== null) {
      setAmount(stripTrailingZeros(walletState.balance));
      setTouched(true);
      resetFeedback();
    }
  }

  function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPhase('confirm');
  }

  async function handleConfirm() {
    setPhase('pending');
    setErrorMsg('');
    setTxHash(null);
    try {
      let hash: string | void;
      if (mode === 'claim') {
        hash = await onClaim?.(amount);
      } else {
        hash = await onBurn?.(amount);
      }
      if (hash) setTxHash(hash);
      setPhase('success');
      setAmount('');
      setTouched(false);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  }

  function handleCancelConfirm() {
    setPhase('idle');
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value);
    setTouched(true);
    if (phase === 'success' || phase === 'error') {
      resetFeedback();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isDisabledKey(e.key)) {
      e.preventDefault();
    }
  }

  function handleToggle(newMode: Mode) {
    setMode(newMode);
    setTouched(false);
    resetFeedback();
  }

  function handleDismissFeedback() {
    resetFeedback();
  }

  const renderDecimalError =
    touched && amount && parseDecimalCount(amount) > STROOP_DECIMALS;
  const renderNegativeError =
    touched && amount && !isValidAmount(amount) && !renderDecimalError;

  // ─── Not installed state ──────────────────────────────────────────
  if (walletState.status === 'notInstalled') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <div className="not-installed">
          <p className="not-installed__icon" data-testid="wallet-icon">⬡</p>
          <p className="not-installed__text" data-testid="not-installed-msg">
            Freighter wallet not detected
          </p>
          <p className="not-installed__hint">
            Install the{' '}
            <a
              href="https://freighter.app"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="freighter-link"
            >
              Freighter browser extension
            </a>{' '}
            to connect your Stellar wallet.
          </p>
          <button
            className="btn btn-connect"
            onClick={onConnect}
            data-testid="retry-connect-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── Disconnected state ──────────────────────────────────────────
  if (walletState.status === 'disconnected') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-prompt">
          {walletState.network !== 'unknown' && (
            <span className="network-badge" data-testid="network-badge-disconnected">
              {formatNetwork(walletState.network)}
            </span>
          )}
          Connect your Freighter wallet to continue
        </p>
        <button
          className="btn btn-connect"
          onClick={onConnect}
          data-testid="connect-wallet-btn"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  // ─── Connecting state ────────────────────────────────────────────
  if (walletState.status === 'connecting') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <p className="wallet-connecting" data-testid="connecting-msg">
          <span className="spinner" data-testid="spinner" />
          Connecting to Freighter…
        </p>
      </div>
    );
  }

  // ─── Wallet error state ──────────────────────────────────────────
  if (walletState.status === 'error') {
    return (
      <div className="claim-burn" data-testid="claim-burn">
        <div className="wallet-error">
          <p data-testid="wallet-error-msg">
            {walletState.error || 'An unknown error occurred'}
          </p>
          <button
            className="btn btn-connect"
            onClick={onConnect}
            data-testid="retry-connect-btn"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ─── Connected state (main UI) ───────────────────────────────────
  return (
    <div className="claim-burn" data-testid="claim-burn">
      <div className="wallet-info">
        <span className="wallet-address" data-testid="wallet-address">
          {formatAddress(walletState.address || '')}
        </span>
        <div className="wallet-info-actions">
          {walletState.network && walletState.network !== 'unknown' && (
            <span
              className={`network-badge network-badge--${walletState.network}`}
              data-testid="network-badge"
            >
              {formatNetwork(walletState.network)}
            </span>
          )}
          {onRefreshBalance && (
            <button
              type="button"
              className="btn btn-icon"
              onClick={onRefreshBalance}
              disabled={phase === 'pending'}
              aria-label="Refresh balance"
              data-testid="refresh-balance-btn"
            >
              &#x21bb;
            </button>
          )}
          {onDisconnect && (
            <button
              className="btn btn-disconnect"
              onClick={onDisconnect}
              data-testid="disconnect-btn"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="toggle" role="group" aria-label="Select mode">
        <button
          className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
          onClick={() => handleToggle('claim')}
          aria-pressed={mode === 'claim'}
          data-testid="toggle-claim"
        >
          Claim
        </button>
        <button
          className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
          onClick={() => handleToggle('burn')}
          aria-pressed={mode === 'burn'}
          data-testid="toggle-burn"
        >
          Burn
        </button>
      </div>

      <form
        onSubmit={handleRequestSubmit}
        className="claim-burn-form"
        data-testid="claim-burn-form"
      >
        <label htmlFor="amount">
          {mode === 'claim' ? 'Amount to claim' : 'Amount to burn'}
          {walletState.balance !== null && (
            <span className="balance-hint">
              Balance: {walletState.balance} XLM
            </span>
          )}
        </label>

        <div className="input-row">
          <div className="input-wrap">
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={handleAmountChange}
              onKeyDown={handleKeyDown}
              placeholder="0.00"
              disabled={phase === 'pending'}
              data-testid="amount-input"
            />
            <span className="input-suffix">XLM</span>
          </div>
          {walletState.balance !== null && mode === 'burn' && (
            <button
              type="button"
              className="btn btn-max"
              onClick={handleMax}
              disabled={phase === 'pending'}
              data-testid="max-btn"
            >
              Max
            </button>
          )}
        </div>

        {touched && renderDecimalError && (
          <p className="field-error" data-testid="amount-error">
            Maximum {STROOP_DECIMALS} decimal places
          </p>
        )}
        {touched && renderNegativeError && (
          <p className="field-error" data-testid="amount-error">
            Enter a valid positive amount
          </p>
        )}
        {exceedsBalance && (
          <p className="field-error" data-testid="balance-error">
            Amount exceeds your balance of {walletState.balance} XLM
          </p>
        )}

        {phase === 'confirm' && (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              {mode === 'claim' ? 'Claim' : 'Burn'}{' '}
              <strong>{amount}</strong> XLM?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-cancel"
                onClick={handleCancelConfirm}
                data-testid="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-${mode}`}
                onClick={handleConfirm}
                data-testid="confirm-btn"
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {phase !== 'confirm' && (
          <button
            type="submit"
            className={`btn btn-${mode}`}
            disabled={phase === 'pending' || !valid}
            data-testid="submit-btn"
          >
            {phase === 'pending' ? (
              <>
                <span className="spinner spinner--small" data-testid="spinner" />
                Processing…
              </>
            ) : mode === 'claim' ? (
              'Claim'
            ) : (
              'Burn'
            )}
          </button>
        )}
      </form>

      <div aria-live="polite" aria-atomic="true">
        {phase === 'success' && (
          <div className="feedback success" role="status" data-testid="success-msg">
            <span>
              {mode === 'claim' ? 'Claimed' : 'Burned'} successfully!
              {txHash && (
                <span className="tx-hash" data-testid="tx-hash">
                  TX: {formatAddress(txHash)}
                </span>
              )}
            </span>
            <button
              type="button"
              className="btn-dismiss"
              onClick={handleDismissFeedback}
              aria-label="Dismiss"
              data-testid="dismiss-success-btn"
            >
              &times;
            </button>
          </div>
        )}
        {phase === 'error' && (
          <div className="feedback error" role="alert" data-testid="error-msg">
            <span>{errorMsg}</span>
            <button
              type="button"
              className="btn-dismiss"
              onClick={handleDismissFeedback}
              aria-label="Dismiss"
              data-testid="dismiss-error-btn"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
