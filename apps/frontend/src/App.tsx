import { ClaimBurn } from './components/claim-burn';
import { useWallet } from './hooks/useWallet';

export function App() {
  const { state, publicKey, expectedNetwork, connect, switchNetwork } = useWallet();

  const handleClaim = async (amount: string) => {
    console.info('Claim request', amount);
    return undefined;
  };

  const handleBurn = async (amount: string) => {
    console.info('Burn request', amount);
    return undefined;
  };

  return (
    <main style={{ padding: '2rem', minHeight: '100vh', background: '#f5f5f5' }}>
      <ClaimBurn
        walletState={state}
        onConnect={connect}
        onSwitchNetwork={switchNetwork}
        onClaim={handleClaim}
        onBurn={handleBurn}
        publicKey={publicKey}
        expectedNetwork={expectedNetwork}
      />
    </main>
  );
}
