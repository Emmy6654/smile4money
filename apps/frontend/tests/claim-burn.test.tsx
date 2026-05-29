import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClaimBurn } from '../src/components/claim-burn';
import type { WalletState } from '../src/types';

function connectedWallet(overrides?: Partial<WalletState>): WalletState {
  return {
    status: 'connected',
    address: 'GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1',
    error: null,
    balance: null,
    network: 'testnet',
    ...overrides,
  };
}

// ─── Wallet States ──────────────────────────────────────────────────

describe('ClaimBurn — wallet states', () => {
  it('shows not-installed state when Freighter is missing', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'notInstalled', address: null, error: null, balance: null, network: 'unknown' }}
      />,
    );
    expect(screen.getByTestId('not-installed-msg')).toHaveTextContent('Freighter wallet not detected');
    expect(screen.getByTestId('freighter-link')).toHaveAttribute('href', 'https://freighter.app');
    expect(screen.getByTestId('retry-connect-btn')).toBeInTheDocument();
  });

  it('calls onConnect from not-installed page', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{ status: 'notInstalled', address: null, error: null, balance: null, network: 'unknown' }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('retry-connect-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connect prompt when disconnected', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'disconnected', address: null, error: null, balance: null, network: 'unknown' }}
      />,
    );
    expect(screen.getByTestId('connect-wallet-btn')).toBeInTheDocument();
    expect(screen.getByText(/Connect your Freighter wallet/i)).toBeInTheDocument();
  });

  it('calls onConnect when connect button clicked', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{ status: 'disconnected', address: null, error: null, balance: null, network: 'unknown' }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('connect-wallet-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows connecting state with spinner', () => {
    render(
      <ClaimBurn
        walletState={{ status: 'connecting', address: null, error: null, balance: null, network: 'unknown' }}
      />,
    );
    expect(screen.getByTestId('connecting-msg')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByText(/Connecting to Freighter/i)).toBeInTheDocument();
  });

  it('shows error state with message', () => {
    render(
      <ClaimBurn
        walletState={{
          status: 'error',
          address: null,
          error: 'Freighter not installed',
          balance: null,
          network: 'unknown',
        }}
      />,
    );
    expect(screen.getByTestId('wallet-error-msg')).toHaveTextContent('Freighter not installed');
    expect(screen.getByTestId('retry-connect-btn')).toBeInTheDocument();
  });

  it('calls onConnect from error retry button', () => {
    const onConnect = vi.fn();
    render(
      <ClaimBurn
        walletState={{
          status: 'error',
          address: null,
          error: 'Something went wrong',
          balance: null,
          network: 'unknown',
        }}
        onConnect={onConnect}
      />,
    );
    fireEvent.click(screen.getByTestId('retry-connect-btn'));
    expect(onConnect).toHaveBeenCalledOnce();
  });

  it('shows form when connected', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('claim-burn-form')).toBeInTheDocument();
  });

  it('shows formatted wallet address', () => {
    render(
      <ClaimBurn
        walletState={connectedWallet({ address: 'GA4QZ3R2X3Y6KZ7J8M9N0P1Q2R3S4T5U6V7W8X9Y0Z1' })}
      />,
    );
    expect(screen.getByTestId('wallet-address')).toHaveTextContent('GA4Q…Y0Z1');
  });

  it('shows disconnect button when onDisconnect provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} onDisconnect={vi.fn()} />);
    expect(screen.getByTestId('disconnect-btn')).toBeInTheDocument();
  });

  it('does not show disconnect button when onDisconnect not provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.queryByTestId('disconnect-btn')).not.toBeInTheDocument();
  });

  it('calls onDisconnect when disconnect button clicked', () => {
    const onDisconnect = vi.fn();
    render(<ClaimBurn walletState={connectedWallet()} onDisconnect={onDisconnect} />);
    fireEvent.click(screen.getByTestId('disconnect-btn'));
    expect(onDisconnect).toHaveBeenCalledOnce();
  });

  it('shows refresh balance button when onRefreshBalance provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} onRefreshBalance={vi.fn()} />);
    expect(screen.getByTestId('refresh-balance-btn')).toBeInTheDocument();
  });

  it('does not show refresh balance button when not provided', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.queryByTestId('refresh-balance-btn')).not.toBeInTheDocument();
  });
});

// ─── Network ────────────────────────────────────────────────────────

describe('ClaimBurn — network', () => {
  it('shows testnet badge when connected to testnet', () => {
    render(<ClaimBurn walletState={connectedWallet({ network: 'testnet' })} />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Testnet');
    expect(badge).toHaveClass('network-badge--testnet');
  });

  it('shows mainnet badge when connected to mainnet', () => {
    render(<ClaimBurn walletState={connectedWallet({ network: 'mainnet' })} />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Mainnet');
    expect(badge).toHaveClass('network-badge--mainnet');
  });

  it('does not show network badge when network is unknown', () => {
    render(<ClaimBurn walletState={connectedWallet({ network: 'unknown' })} />);
    expect(screen.queryByTestId('network-badge')).not.toBeInTheDocument();
  });
});

// ─── Toggle ─────────────────────────────────────────────────────────

describe('ClaimBurn — toggle', () => {
  it('defaults to claim mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Claim');
  });

  it('switches to burn mode', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('toggle-burn')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('toggle-claim')).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Burn');
  });

  it('resets feedback when toggling after error', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('fail'));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);

    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('toggle-burn'));
      expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
    });
  });
});

// ─── Confirmation step ─────────────────────────────────────────────

describe('ClaimBurn — confirmation', () => {
  it('shows confirmation overlay after clicking submit', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-btn')).toHaveTextContent('Confirm');
    expect(screen.getByTestId('cancel-btn')).toHaveTextContent('Cancel');
  });

  it('hides submit button when showing confirmation', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.queryByTestId('submit-btn')).not.toBeInTheDocument();
  });

  it('cancels confirmation and shows submit button again', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('confirm-overlay')).not.toBeInTheDocument();
  });

  it('shows amount in confirmation text', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '42.5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    expect(screen.getByTestId('confirm-overlay')).toHaveTextContent('42.5');
  });
});

// ─── Submit ─────────────────────────────────────────────────────────

describe('ClaimBurn — submit', () => {
  async function submitWithConfirm(amount: string, onClaim?: any) {
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} onBurn={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: amount } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
  }

  it('calls onClaim with amount after confirmation', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    await submitWithConfirm('10', onClaim);
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onClaim).toHaveBeenCalledWith('10');
  });

  it('calls onBurn with amount after confirmation', async () => {
    const onBurn = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onBurn={onBurn} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '25' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => expect(screen.getByTestId('success-msg')).toBeInTheDocument());
    expect(onBurn).toHaveBeenCalledWith('25');
  });

  it('shows error on failure', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('Insufficient balance'));
    await submitWithConfirm('5', onClaim);
    await waitFor(() =>
      expect(screen.getByTestId('error-msg')).toHaveTextContent('Insufficient balance'),
    );
  });

  it('disables submit when amount is empty', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is zero', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '0' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount is negative', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '-5' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('disables submit when amount exceeds 7 decimal places', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1.12345678' } });
    expect(screen.getByTestId('submit-btn')).toBeDisabled();
  });

  it('shows inline error for too many decimals', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1.12345678' } });
    expect(screen.getByTestId('amount-error')).toHaveTextContent('7 decimal places');
  });

  it('does not show inline error for valid amount', () => {
    render(<ClaimBurn walletState={connectedWallet()} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '1.1234567' } });
    expect(screen.queryByTestId('amount-error')).not.toBeInTheDocument();
  });

  it('disables input and shows spinner during pending', async () => {
    const onClaim = vi.fn().mockImplementation(() => new Promise<void>(() => {}));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    expect(screen.getByTestId('amount-input')).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('resets feedback on amount change after success', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('success-msg')).toBeInTheDocument();
      fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '20' } });
      expect(screen.queryByTestId('success-msg')).not.toBeInTheDocument();
    });
  });
});

// ─── Dismiss feedback ──────────────────────────────────────────────

describe('ClaimBurn — dismiss feedback', () => {
  it('dismisses success message', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('success-msg')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('dismiss-success-btn'));
      expect(screen.queryByTestId('success-msg')).not.toBeInTheDocument();
    });
  });

  it('dismisses error message', async () => {
    const onClaim = vi.fn().mockRejectedValue(new Error('fail'));
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '5' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error-msg')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('dismiss-error-btn'));
      expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
    });
  });
});

// ─── Transaction hash ──────────────────────────────────────────────

describe('ClaimBurn — transaction hash', () => {
  it('displays transaction hash when onClaim returns one', async () => {
    const txHash = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1';
    const onClaim = vi.fn().mockResolvedValue(txHash);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('tx-hash')).toBeInTheDocument();
      expect(screen.getByTestId('tx-hash')).toHaveTextContent('a1b2…f0a1');
    });
  });

  it('does not show tx hash when onClaim returns void', async () => {
    const onClaim = vi.fn().mockResolvedValue(undefined);
    render(<ClaimBurn walletState={connectedWallet()} onClaim={onClaim} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '10' } });
    fireEvent.click(screen.getByTestId('submit-btn'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('success-msg')).toBeInTheDocument();
      expect(screen.queryByTestId('tx-hash')).not.toBeInTheDocument();
    });
  });
});

// ─── Max button ────────────────────────────────────────────────────

describe('ClaimBurn — Max button', () => {
  it('shows Max button in burn mode when balance is available', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '500' })} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.getByTestId('max-btn')).toBeInTheDocument();
  });

  it('does not show Max button in claim mode', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '500' })} />);
    expect(screen.queryByTestId('max-btn')).not.toBeInTheDocument();
  });

  it('does not show Max button when balance is null', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: null })} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    expect(screen.queryByTestId('max-btn')).not.toBeInTheDocument();
  });

  it('fills amount with balance when Max clicked', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '250.5' })} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.click(screen.getByTestId('max-btn'));
    expect(screen.getByTestId('amount-input')).toHaveValue(250.5);
  });
});

// ─── Balance validation ────────────────────────────────────────────

describe('ClaimBurn — balance validation', () => {
  it('shows balance error when burn amount exceeds balance', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '100' })} />);
    fireEvent.click(screen.getByTestId('toggle-burn'));
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '200' } });
    expect(screen.getByTestId('balance-error')).toHaveTextContent('exceeds your balance');
  });

  it('does not check balance in claim mode', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '100' })} />);
    fireEvent.change(screen.getByTestId('amount-input'), { target: { value: '200' } });
    expect(screen.queryByTestId('balance-error')).not.toBeInTheDocument();
  });
});

// ─── Balance display ───────────────────────────────────────────────

describe('ClaimBurn — balance display', () => {
  it('shows balance when provided', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: '1000' })} />);
    expect(screen.getByText(/Balance: 1000 XLM/)).toBeInTheDocument();
  });

  it('does not show balance when null', () => {
    render(<ClaimBurn walletState={connectedWallet({ balance: null })} />);
    expect(screen.queryByText(/Balance:/)).not.toBeInTheDocument();
  });
});
