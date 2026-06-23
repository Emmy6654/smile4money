# Emergency Drain Runbook

Procedure for using `emergency_drain` to recover funds from the escrow contract during a critical exploit.

## When to use this

Use `emergency_drain` only when:

- An active exploit is draining or threatening to drain the escrow contract, **and**
- There is no time to wait for match resolution via the oracle.

Do **not** use it for routine administration. The function transfers every token the contract holds to a single address in one transaction, bypassing all per-match accounting.

## Prerequisites

- The **admin private key** for the deployed contract.
- A **safe cold-wallet address** (`SAFE_ADDRESS`) controlled offline or by multi-sig, never the admin hot wallet.
- The **Stellar CLI** (`stellar`) installed and configured for the target network.
- The **contract address** (`CONTRACT_ADDRESS`) of the deployed escrow contract.

## Step-by-step

### 1. Confirm the exploit

Before draining, verify the threat is real:

```bash
stellar contract invoke \
  --id $CONTRACT_ADDRESS \
  --network $NETWORK \
  -- get_match --match_id <id>
```

Check unusual state transitions, repeated results submitted for the same match, or the contract balance dropping unexpectedly.

### 2. Pause the contract

Pausing blocks `create_match`, `deposit`, and `submit_result` immediately.

```bash
stellar contract invoke \
  --id $CONTRACT_ADDRESS \
  --source $ADMIN_SECRET_KEY \
  --network $NETWORK \
  -- pause
```

Confirm the contract is paused before proceeding. Any subsequent call to `create_match` or `deposit` should return `Error::ContractPaused (9)`.

### 3. Drain to the safe address

```bash
stellar contract invoke \
  --id $CONTRACT_ADDRESS \
  --source $ADMIN_SECRET_KEY \
  --network $NETWORK \
  -- emergency_drain \
     --to $SAFE_ADDRESS \
     --caller $ADMIN_ADDRESS
```

`emergency_drain` will:

1. Verify `caller` is the registered admin.
2. Verify the contract is paused (returns `Error::NotPaused (18)` otherwise).
3. Query the contract's token balance.
4. Transfer the full balance to `to`.
5. Emit an `admin:drain` event recording `(amount, to, admin)`.

If the balance is zero the call succeeds silently (no transfer is attempted).

### 4. Verify the transfer

```bash
stellar contract invoke \
  --id $TOKEN_ADDRESS \
  --network $NETWORK \
  -- balance --id $SAFE_ADDRESS
```

The safe address should hold the drained amount. The contract balance should be zero.

### 5. Record the incident

Document:

- UTC timestamp of `pause()` and `emergency_drain()`.
- Transaction hashes for both calls.
- Amount drained and destination address.
- Root cause (if known at time of drain).

Keep this in an incident log separate from the repository.

### 6. Post-incident

After the exploit is fully understood and patched:

- Deploy a new contract version.
- Redistribute funds from `SAFE_ADDRESS` to affected players based on the match state at time of pause.
- Unpause or retire the old contract as appropriate.

```bash
# Unpause (only if continuing to use the same contract)
stellar contract invoke \
  --id $CONTRACT_ADDRESS \
  --source $ADMIN_SECRET_KEY \
  --network $NETWORK \
  -- unpause
```

## Error reference

| Error | Code | Meaning |
|-------|------|---------|
| `NotPaused` | 18 | `emergency_drain` called without pausing first |
| `Unauthorized` | 4 | `caller` is not the registered admin |

## Future enhancements

- **Time-lock**: enforce a minimum delay (e.g., 24 h) between `pause()` and `emergency_drain()` so players can challenge an illegitimate drain before it executes.
- **Multi-sig**: require M-of-N admin key signatures so no single compromised key can drain the contract unilaterally.
