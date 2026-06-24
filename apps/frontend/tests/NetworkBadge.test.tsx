import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NetworkBadge } from '../src/components/NetworkBadge';

describe('NetworkBadge', () => {
  it('shows Mainnet with green background', () => {
    render(<NetworkBadge network="mainnet" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Mainnet');
    expect(badge).toHaveAttribute('data-network', 'mainnet');
    expect(badge.className).toContain('bg-green-600');
  });

  it('shows Testnet with amber background', () => {
    render(<NetworkBadge network="testnet" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Testnet');
    expect(badge).toHaveAttribute('data-network', 'testnet');
    expect(badge.className).toContain('bg-amber-500');
  });

  it('shows Futurenet with orange background', () => {
    render(<NetworkBadge network="futurenet" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Futurenet');
    expect(badge).toHaveAttribute('data-network', 'futurenet');
    expect(badge.className).toContain('bg-orange-500');
  });

  it('shows Standalone with grey background', () => {
    render(<NetworkBadge network="standalone" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Standalone');
    expect(badge).toHaveAttribute('data-network', 'standalone');
    expect(badge.className).toContain('bg-gray-400');
  });

  it('shows unknown network as-is with grey background', () => {
    render(<NetworkBadge network="unknown" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('unknown');
    expect(badge).toHaveAttribute('data-network', 'unknown');
    expect(badge.className).toContain('bg-gray-400');
  });

  it('defaults to testnet when no network prop given', () => {
    render(<NetworkBadge />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveAttribute('data-network');
  });
});
