# Testing of Program Service

## 1. Set up test environment
export SOLANA_RPC_URL=...
export LOCALSOLANA_PROGRAM_ID=...
export FEE_RECIPIENT=...
export FEE_PAYER=...

## 2. Create test order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "seller": "...",
    "buyer": "...",
    "amount": "1000000000",
    "token": "..."
  }'

## 3. Release funds
curl -X POST http://localhost:3000/api/transactions/release \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "123",
    "transaction": "base64_encoded_transaction"
  }'
```

## 4. **Error Cases to Test**:

- Invalid order ID
- Invalid account addresses
- Missing token accounts
- Insufficient balances
- Wrong transaction signatures
- Network errors
- Invalid state transitions


## Jest Testing

Run all tests once:
`npm test`

Run tests in watch mode (automatically re-runs when files change):
`npm run test:watch`

Run specific test file:
`npm test tests/services/ProgramService.test.ts`