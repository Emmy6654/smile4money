import React, { useMemo, useState } from 'react';
import '../styles/claim-burn.css';
import type { WalletState as WalletStateObject } from '../types';

type Mode = 'claim' | 'burn';
type SubmitPhase = 'idle' | 'confirm' | 'pending' | 'success' | 'error';

type WalletStatus = 'checking' | 'notInstalled' | 'disconnected' | 'connecting' | 'connected' | 'wrongNetwork';

type WalletState = WalletStatus | WalletStateObject;

interface ClaimBurnProps {
  walletState: WalletState;
  onConnect?: () => void;
  onClaim?: (amount: string) => Promise<string | void>;
  onBurn?: (amount: string) => Promise<string | void>;
  onSwitchNetwork?: () => void;
  publicKey?: string | null;
  expectedNetwork?: string;
}

function isValidAmount(value: string) {
  return value !== '' && !Number.isNaN(Number(value)) && Number(value) > 0;
}

function stripTrailingZeros(value: string) {
  return value.replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/, '');
}

export function ClaimBurn({
  walletState,
  onConnect,
  onClaim,
  onBurn,
  onSwitchNetwork,
  publicKey,
  expectedNetwork = 'testnet',
}: ClaimBurnProps) {
  const [mode, setMode] = useState<Mode>('claim');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const status = typeof walletState === 'string' ? walletState : walletState.status;
  const balance = typeof walletState === 'string' ? null : walletState.balance;
  const walletAddress = typeof walletState === 'string' ? null : walletState.address;
  const walletPublicKey = publicKey ?? walletAddress;

  const balanceNum = useMemo(
    () => (balance && isValidAmount(balance) ? Number(balance) : null),
    [balance],
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

  const resetFeedback = () => {
    setErrorMsg('');
    setTxHash(null);
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    setPhase('idle');
    resetFeedback();
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (phase === 'error' || phase === 'success') {
      setPhase('idle');
      setErrorMsg('');
    }
  };

  const handleMax = () => {
    if (balance) {
      setAmount(stripTrailingZeros(balance));
      resetFeedback();
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid) return;
    setPhase('confirm');
    resetFeedback();
  };

  const handleConfirm = async () => {
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
      if (hash) {
        setTxHash(hash);
      }
      setPhase('success');
      setAmount('');
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  const handleCancel = () => {
    setPhase('idle');
  };

  function renderNotInstalled() {
    return (
      <div className="wallet-state" data-testid="wallet-not-installed">
        <div className="wallet-state-icon">&#9888;&#65039;</div>
        <h3 className="wallet-state-title">Freighter Not Found</h3>
        <p className="wallet-state-message">
          Please install the{' '}
          <a href="https://freighter.app" target="_blank" rel="noopener noreferrer">
            Freighter wallet extension
          </a>{' '}
          to continue.
        </p>
      </div>
    );
  }

  function renderDisconnected() {
    return (
      <div className="wallet-state" data-testid="wallet-disconnected">
        <div className="wallet-state-icon">&#128188;</div>
        <h3 className="wallet-state-title">Connect Your Wallet</h3>
        <p className="wallet-state-message">
          Connect your Freighter wallet to claim rewards or burn tokens.
        </p>
        <button className="btn btn-connect" onClick={onConnect} data-testid="connect-wallet-btn">
          Connect Wallet
        </button>
      </div>
    );
  }

  function renderConnecting() {
    return (
      <div className="wallet-state" data-testid="wallet-connecting">
        <div className="spinner" />
        <p className="wallet-state-message">Connecting to Freighter&hellip;</p>
      </div>
    );
  }

  function renderWrongNetwork() {
    return (
      <div className="wallet-state" data-testid="wallet-wrong-network">
        <div className="wallet-state-icon">&#127760;</div>
        <h3 className="wallet-state-title">Wrong Network</h3>
        <p className="wallet-state-message">
          Please switch your Freighter wallet to <strong>{expectedNetwork}</strong>.
        </p>
        <button
          className="btn btn-switch-network"
          onClick={onSwitchNetwork}
          data-testid="switch-network-btn"
        >
          Switch to {expectedNetwork}
        </button>
      </div>
    );
  }

  function renderForm() {
    return (
      <>
        <div className="toggle" role="group" aria-label="Select mode">
          <button
            type="button"
            className={`toggle-btn${mode === 'claim' ? ' active' : ''}`}
            onClick={() => handleModeChange('claim')}
            aria-pressed={mode === 'claim'}
            data-testid="toggle-claim"
          >
            Claim
          </button>
          <button
            type="button"
            className={`toggle-btn${mode === 'burn' ? ' active' : ''}`}
            onClick={() => handleModeChange('burn')}
            aria-pressed={mode === 'burn'}
            data-testid="toggle-burn"
          >
            Burn
          </button>
        </div>

        {walletPublicKey && (
          <div className="wallet-info" data-testid="wallet-info">
            <span className="wallet-info-label">Connected</span>
            <span className="wallet-info-address">
              {walletPublicKey.slice(0, 4)}&hellip;{walletPublicKey.slice(-4)}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="claim-burn-form">
          <label htmlFor="amount">
            {mode === 'claim' ? 'Claim amount' : 'Burn amount'} (XLM)
          </label>
          <div className="amount-row">
            <input
              id="amount"
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              disabled={phase === 'pending'}
              data-testid="amount-input"
            />
            <button
              type="button"
              className="btn btn-max"
              onClick={handleMax}
              disabled={!balance || phase === 'pending'}
            >
              Max
            </button>
          </div>

          {balance && (
            <p className="helper-text" data-testid="balance-text">
              Balance: {balance} XLM
            </p>
          )}
          {exceedsBalance && (
            <p className="feedback error" role="alert" data-testid="balance-error">
              Amount exceeds available balance.
            </p>
          )}

          {phase !== 'confirm' && (
            <button
              type="submit"
              className={`btn btn-${mode}`}
              disabled={!valid || phase === 'pending'}
              data-testid="submit-btn"
            >
              {phase === 'pending' ? 'Processing…' : mode === 'claim' ? 'Claim' : 'Burn'}
            </button>
          )}
        </form>

        {phase === 'confirm' && (
          <div className="confirm-overlay" data-testid="confirm-overlay">
            <p className="confirm-text">
              Confirm {mode} of <strong>{amount}</strong> XLM?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-switch-network"
                onClick={handleCancel}
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

        <div aria-live="polite" aria-atomic="true">
          {phase === 'success' && (
            <p className="feedback success" role="status" data-testid="success-msg">
              {mode === 'claim' ? 'Claimed successfully!' : 'Burned successfully!'}
            </p>
          )}
          {phase === 'error' && (
            <p className="feedback error" role="alert" data-testid="error-msg">
              {errorMsg}
            </p>
          )}
          {txHash && (
            <p className="feedback success" role="status" data-testid="tx-hash">
              Transaction hash: {txHash}
            </p>
          )}
        </div>
      </>
    );
  }

  const stateMap: Record<WalletStatus, React.ReactNode> = {
    checking: renderConnecting(),
    notInstalled: renderNotInstalled(),
    disconnected: renderDisconnected(),
    connecting: renderConnecting(),
    wrongNetwork: renderWrongNetwork(),
    connected: renderForm(),
  };

  return (
    <div className="claim-burn" data-testid="claim-burn">
      <h2 className="claim-burn-title">Claim &amp; Burn</h2>
      {stateMap[status]}
    </div>
  );
}
