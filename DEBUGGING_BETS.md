# Debugging Guide: "My Bets" Not Loading

## The Issue
The BetsManagement page is not showing your placed bets even though you have placed bets on the contract.

## What I've Added to Help Debug

### 1. Enhanced Console Logging
The app now logs detailed information to the browser console:
- 🔍 When markets are being loaded
- 📊 Number of markets found
- 👤 Your wallet address
- 💰 Each bet being checked
- ✅ When a bet is found

### 2. Debug Panel in UI
Click "Show Debug Info" button on the Bets Management page to see:
- Wallet connection status
- Your account address
- Provider status
- Number of markets
- Number of bets found
- Contract address being used

### 3. Standalone Test Tool
Open `frontend/test-contract.html` in your browser to test the contract directly without the React app.

## How to Debug

### Step 1: Check Console Logs
1. Go to `/bets` page
2. Open browser console (F12 → Console tab)
3. Refresh the page
4. Look for these logs:
   ```
   🔍 Loading markets...
   📊 Markets loaded: X
   👤 Fetching bets for account: 0x...
   🔍 getAllUserBets called for: 0x...
   📊 Total markets to check: X
   🎯 Checking market 0: ...
   ```

### Step 2: Check Debug Panel
1. Click "Show Debug Info" button
2. Verify:
   - ✅ Wallet Connected: Yes
   - ✅ Provider: Connected
   - Your account address matches the one you used to place bets
   - Total Markets > 0

### Step 3: Use Test Tool
1. Open `frontend/test-contract.html` in browser
2. Click "Test Contract" button
3. Connect your MetaMask
4. See if your bets are detected

## Common Issues & Solutions

### Issue 1: Wrong Network
**Symptom:** No markets found or errors
**Solution:** Make sure MetaMask is connected to Hedera Testnet (Chain ID: 296)

### Issue 2: Wrong Account
**Symptom:** No bets found but you placed bets
**Solution:** Switch to the MetaMask account you used to place the original bets

### Issue 3: Contract Address Mismatch
**Symptom:** Markets load but wrong data
**Solution:** Verify contract address is `0x53f25235e70380605ea794da768d9662ab72ad52`

### Issue 4: Bets Placed via Different Contract
**Symptom:** Bets don't show up
**Solution:** Check if you placed bets on a different contract deployment

## Expected Console Output (With Bets)

```
🔍 Loading markets...
📊 Markets loaded: 3
👤 Fetching bets for account: 0xYourAddress
🔍 getAllUserBets called for: 0xYourAddress
📊 Total markets to check: 3

🎯 Checking market 0: Will Bitcoin reach $100k?
   Outcomes: 2
   Outcome 0 (Yes): 0.0 HBAR
   Outcome 1 (No): 5.0 HBAR
   💵 getUserBet(0, 1): 5.0 HBAR (raw: 5000000000000000000)
   ✅ Found bet! Adding to userBets

💰 Total user bets found: 1
💰 User bets found: 1 [...]
```

## Expected Console Output (No Bets)

```
🔍 Loading markets...
📊 Markets loaded: 3
👤 Fetching bets for account: 0xYourAddress
🔍 getAllUserBets called for: 0xYourAddress
📊 Total markets to check: 3

🎯 Checking market 0: Will Bitcoin reach $100k?
   Outcomes: 2
   Outcome 0 (Yes): 0.0 HBAR
   Outcome 1 (No): 0.0 HBAR

💰 Total user bets found: 0
```

## What to Check

1. **Did you actually place bets?** Check on HashScan if transactions went through
2. **Right wallet?** Use the same MetaMask account
3. **Right network?** Hedera Testnet (296)
4. **Right contract?** 0x53f25235e70380605ea794da768d9662ab72ad52

## Next Steps

After checking the console logs, you'll be able to see:
- Are markets loading? (Yes/No)
- Is your wallet connected? (Yes/No)
- Are we checking the right account? (Address)
- Are any bets being found? (Count)

Share the console output with me and I can help debug further!
