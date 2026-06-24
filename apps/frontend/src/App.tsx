import { ClaimBurn } from './components/claim-burn';
import { NetworkBadge } from './components/NetworkBadge';
import { useStellarWallet } from './hooks/useStellarWallet';
import type { WalletStatus } from './types';

export function App() {
  const { status, address, balance, network, connect, disconnect, refreshBalance } = useStellarWallet();

  const walletState = (
    status === 'connected' && network !== 'unknown' && network !== 'testnet'
      ? 'wrongNetwork'
      : status
  ) as WalletStatus;

  const handleClaim = async (amount: string): Promise<string | void> => {
    // TODO: submit claim transaction via Stellar SDK
    console.info('Claim request', amount);
  };

  const handleBurn = async (amount: string): Promise<string | void> => {
    // TODO: submit burn transaction via Stellar SDK
    console.info('Burn request', amount);
  };

  return (
    <main className="bg-gray-100" style={{ padding: '2rem', minHeight: '100vh' }}>
      <div className="mb-4">
        <NetworkBadge />
      </div>
      <ClaimBurn
        walletState={walletState}
        onConnect={connect}
        onDisconnect={disconnect}
        onRefreshBalance={refreshBalance}
        onClaim={handleClaim}
        onBurn={handleBurn}
        publicKey={address}
        balance={balance}
        expectedNetwork="testnet"
      />
    </main>
  );
}
