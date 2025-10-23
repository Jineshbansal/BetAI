// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ParimutuelPredictionMarket
 * @dev A parimutuel prediction market contract where users bet on outcomes.
 * The total pool of money from all bets is distributed to those who bet
 * on the correct outcome, proportional to their bet amount.
 * This version is centralized, relying on a trusted oracle (the deployer)
 * to add questions and resolve markets.
 */
contract ParimutuelPredictionMarket {

    // 'totalBetAmount' tracks the total Ether bet on this single outcome.
    struct Outcome {
        string name;
        uint256 totalBetAmount;
    }

    struct Question {
        string question;
        Outcome[] outcomes;
        uint256 endTime;
        bool marketResolved;
        uint256 winningOutcome;
        uint256 totalMarketPool; // Tracks the total Ether bet on this entire question.
    }

    mapping(uint256 => Question) public questions;
    uint256 public questionCounter;

    address public immutable oracle; // Set once at deployment.

    // Renamed from userShares to userBets for clarity.
    // Tracks userBetAmount = user[questionId][outcomeIndex]
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public userBets;

    // Tracks if a user has already claimed their winnings for a specific question.
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // --- Events ---
    // Simplified and renamed for clarity.
    event QuestionAdded(uint256 indexed questionId, string question, string[] outcomeNames, uint256 endTime);
    event BetPlaced(uint256 indexed questionId, address indexed user, uint256 indexed outcomeIndex, uint256 amount);
    event MarketResolved(uint256 indexed questionId, uint256 indexed winningOutcome);
    event WinningsClaimed(uint256 indexed questionId, address indexed user, uint256 amount);

    constructor() {
        oracle = msg.sender;
    }

    /**
     * @dev Adds a new question (market) to the contract.
     * Only the oracle can call this.
     */
    function addQuestion(string memory _question, string[] memory _outcomeNames, uint256 _endTime) public {
        require(msg.sender == oracle, "Only the oracle can add questions");
        
        uint256 questionId = questionCounter++;
        Question storage newQuestion = questions[questionId];
        newQuestion.question = _question;
        newQuestion.endTime = _endTime;
        // newQuestion.totalMarketPool is 0 by default, which is correct.

        for (uint256 i = 0; i < _outcomeNames.length; i++) {
            newQuestion.outcomes.push(Outcome({
                name: _outcomeNames[i],
                totalBetAmount: 0 // Initialize bet amount to 0.
            }));
        }

        emit QuestionAdded(questionId, _question, _outcomeNames, _endTime);
    }

    /**
     * @dev Places a bet on an outcome.
     * The `_amount` is the amount of Ether (in wei) the user is betting.
     */
    function placeBet(uint256 _questionId, uint256 _outcomeIndex, uint256 _amount) public payable {
        Question storage q = questions[_questionId];
        require(!q.marketResolved, "Market has been resolved");
        require(block.timestamp < q.endTime, "Market has ended");
        require(_outcomeIndex < q.outcomes.length, "Invalid outcome index");
        require(msg.value == _amount, "Bet amount must match sent Ether");
        require(_amount > 0, "Bet must be greater than zero");

        // 1. Add bet to the specific outcome's pool
        q.outcomes[_outcomeIndex].totalBetAmount += _amount;
        
        // 2. Add bet to the question's total pool
        q.totalMarketPool += _amount;

        // 3. Record the user's bet
        userBets[msg.sender][_questionId][_outcomeIndex] += _amount;

        emit BetPlaced(_questionId, msg.sender, _outcomeIndex, _amount);
    }

    /**
     * @dev The 'sellShares' function has been REMOVED.
     * In a parimutuel system, bets are locked until the market is resolved.
     * This prevents the insolvency and logic flaws of the original contract.
     */

    /**
     * @dev Resolves the market, setting the winning outcome.
     * Only the oracle can call this.
     */
    function resolveMarket(uint256 _questionId, uint256 _winningOutcome) public {
        require(msg.sender == oracle, "Only the oracle can resolve the market");
        Question storage q = questions[_questionId];
        require(!q.marketResolved, "Market has already been resolved");
        // Ensure oracle can only resolve *after* the market ends
        require(block.timestamp > q.endTime, "Market has not ended yet");
        require(_winningOutcome < q.outcomes.length, "Invalid winning outcome");

        q.marketResolved = true;
        q.winningOutcome = _winningOutcome;

        emit MarketResolved(_questionId, _winningOutcome);
    }

    /**
     * @dev Allows a user to claim their winnings from a resolved market.
     */
    function claimWinnings(uint256 _questionId) public {
        Question storage q = questions[_questionId];
        require(q.marketResolved, "Market has not been resolved");
        require(!hasClaimed[_questionId][msg.sender], "Winnings already claimed");

        // Get the user's total bet on the winning outcome
        uint256 userBetOnWinner = userBets[msg.sender][_questionId][q.winningOutcome];
        require(userBetOnWinner > 0, "No winning bets to claim");

        // Get the total pool of bets on the winning outcome
        uint256 totalWinningPool = q.outcomes[q.winningOutcome].totalBetAmount;
        // Avoid division by zero if, somehow, no one bet on the winning outcome
        if (totalWinningPool == 0) {
            hasClaimed[_questionId][msg.sender] = true; // Mark as claimed, but pay 0
            return;
        }

        // Get the total pool of money for the entire question
        uint256 totalMarketPool = q.totalMarketPool;

        // --- The Core Parimutuel Logic ---
        // Your winnings = (Your Bet / Total Winning Pool) * Total Market Pool
        uint256 winnings = (userBetOnWinner * totalMarketPool) / totalWinningPool;
        
        // Mark as claimed *before* sending Ether (Checks-Effects-Interactions pattern)
        hasClaimed[_questionId][msg.sender] = true;

        if (winnings > 0) {
            // Send the winnings
            payable(msg.sender).transfer(winnings);
            emit WinningsClaimed(_questionId, msg.sender, winnings);
        }
    }

    /**
     * @dev Helper function to get the state of a market.
     * Note: This function will become expensive to call as 'outcomes' grows.
     */
    function getMarket(uint256 _questionId) public view 
        returns (string memory, Outcome[] memory, uint256, bool, uint256, uint256) 
    {
        Question storage q = questions[_questionId];
        return (
            q.question, 
            q.outcomes, 
            q.endTime, 
            q.marketResolved, 
            q.winningOutcome, 
            q.totalMarketPool
        );
    }
}