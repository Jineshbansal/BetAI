// Contract configuration for Hedera Testnet (EVM)
// Hedera Testnet chainId: 296 (0x128)
export const HEDERA_CONTRACT_ID = '0.0.7100616'
export const HEDERA_TESTNET_CHAIN_ID_DEC = 296
export const HEDERA_TESTNET_CHAIN_ID_HEX = '0x128'
export const HEDERA_TESTNET_RPC = 'https://testnet.hashio.io/api'

// EVM address from HashScan. You can override via VITE_CONTRACT_ADDRESS env.
export const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS || '0x53f25235e70380605ea794da768d9662ab72ad52').toLowerCase()

// ABI for ParimutuelPredictionMarket (from HashScan)
export const contractABI = [
	{ "type": "constructor", "inputs": [], "stateMutability": "nonpayable" },
	{ "type": "function", "stateMutability": "view", "name": "getMarket", "inputs": [ { "name": "_questionId", "type": "uint256" } ], "outputs": [
		{ "name": "question", "type": "string" },
		{ "name": "outcomes", "type": "tuple[]", "components": [ {"name":"name","type":"string"}, {"name":"totalBetAmount","type":"uint256"} ] },
		{ "name": "endTime", "type": "uint256" },
		{ "name": "marketResolved", "type": "bool" },
		{ "name": "winningOutcome", "type": "uint256" },
		{ "name": "totalMarketPool", "type": "uint256" }
	] },
	{ "type": "function", "stateMutability": "view", "name": "hasClaimed", "inputs": [ {"name":"","type":"uint256"}, {"name":"","type":"address"} ], "outputs": [ {"type":"bool"} ] },
	{ "type": "function", "stateMutability": "view", "name": "oracle", "inputs": [], "outputs": [ {"type":"address"} ] },
	{ "type": "function", "stateMutability": "view", "name": "questionCounter", "inputs": [], "outputs": [ {"type":"uint256"} ] },
	{ "type": "function", "stateMutability": "view", "name": "questions", "inputs": [ {"name":"","type":"uint256"} ], "outputs": [
		{"name":"question","type":"string"},
		{"name":"endTime","type":"uint256"},
		{"name":"marketResolved","type":"bool"},
		{"name":"winningOutcome","type":"uint256"},
		{"name":"totalMarketPool","type":"uint256"}
	] },
	{ "type": "function", "stateMutability": "view", "name": "userBets", "inputs": [ {"name":"","type":"address"}, {"name":"","type":"uint256"}, {"name":"","type":"uint256"} ], "outputs": [ {"type":"uint256"} ] },
	{ "type": "function", "stateMutability": "nonpayable", "name": "addQuestion", "inputs": [ {"name":"_question","type":"string"}, {"name":"_outcomeNames","type":"string[]"}, {"name":"_endTime","type":"uint256"} ], "outputs": [] },
	{ "type": "function", "stateMutability": "nonpayable", "name": "claimWinnings", "inputs": [ {"name":"_questionId","type":"uint256"} ], "outputs": [] },
	{ "type": "function", "stateMutability": "payable", "name": "placeBet", "inputs": [ {"name":"_questionId","type":"uint256"}, {"name":"_outcomeIndex","type":"uint256"}, {"name":"_amount","type":"uint256"} ], "outputs": [] },
	{ "type": "function", "stateMutability": "nonpayable", "name": "resolveMarket", "inputs": [ {"name":"_questionId","type":"uint256"}, {"name":"_winningOutcome","type":"uint256"} ], "outputs": [] },
	{ "type": "event", "name": "BetPlaced", "inputs": [ {"name":"questionId","type":"uint256","indexed":true}, {"name":"user","type":"address","indexed":true}, {"name":"outcomeIndex","type":"uint256","indexed":true}, {"name":"amount","type":"uint256","indexed":false} ], "anonymous": false },
	{ "type": "event", "name": "MarketResolved", "inputs": [ {"name":"questionId","type":"uint256","indexed":true}, {"name":"winningOutcome","type":"uint256","indexed":true} ], "anonymous": false },
	{ "type": "event", "name": "QuestionAdded", "inputs": [ {"name":"questionId","type":"uint256","indexed":true}, {"name":"question","type":"string","indexed":false}, {"name":"outcomeNames","type":"string[]","indexed":false}, {"name":"endTime","type":"uint256","indexed":false} ], "anonymous": false },
	{ "type": "event", "name": "WinningsClaimed", "inputs": [ {"name":"questionId","type":"uint256","indexed":true}, {"name":"user","type":"address","indexed":true}, {"name":"amount","type":"uint256","indexed":false} ], "anonymous": false }
]
