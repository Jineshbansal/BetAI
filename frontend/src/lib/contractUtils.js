import { ethers } from 'ethers'
import { CONTRACT_ADDRESS, contractABI } from '../contracts/config'

/**
 * Get contract instance with signer (for write operations)
 */
export function getContractWithSigner(signer) {
  if (!signer) throw new Error('Signer is required')
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer)
}

/**
 * Get contract instance with provider (for read operations)
 */
export function getContractWithProvider(provider) {
  if (!provider) throw new Error('Provider is required')
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider)
}

/**
 * Fetch the total number of questions from the contract
 */
export async function getQuestionCounter(provider) {
  try {
    const contract = getContractWithProvider(provider)
    const counter = await contract.questionCounter()
    return Number(counter)
  } catch (error) {
    console.error('Error fetching question counter:', error)
    throw error
  }
}

/**
 * Fetch a single market/question by ID
 * Returns: { question, outcomes, endTime, marketResolved, winningOutcome, totalMarketPool }
 */
export async function getMarket(provider, questionId) {
  try {
    const contract = getContractWithProvider(provider)
    const result = await contract.getMarket(questionId)
    
    return {
      questionId,
      question: result[0],
      outcomes: result[1].map(o => ({
        name: o.name,
        totalBetAmount: ethers.formatEther(o.totalBetAmount)
      })),
      endTime: Number(result[2]),
      marketResolved: result[3],
      winningOutcome: Number(result[4]),
      totalMarketPool: ethers.formatEther(result[5])
    }
  } catch (error) {
    console.error(`Error fetching market ${questionId}:`, error)
    throw error
  }
}

/**
 * Fetch all markets from the contract
 */
export async function getAllMarkets(provider) {
  try {
    const counter = await getQuestionCounter(provider)
    const markets = []
    
    for (let i = 0; i < counter; i++) {
      try {
        const market = await getMarket(provider, i)
        markets.push(market)
      } catch (err) {
        console.warn(`Failed to fetch market ${i}:`, err)
      }
    }
    
    return markets
  } catch (error) {
    console.error('Error fetching all markets:', error)
    throw error
  }
}

/**
 * Get user's bet amount for a specific question and outcome
 * Returns the amount in HBAR/ETH (formatted)
 */
export async function getUserBet(provider, userAddress, questionId, outcomeIndex) {
  try {
    const contract = getContractWithProvider(provider)
    const betAmount = await contract.userBets(userAddress, questionId, outcomeIndex)
    const formatted = ethers.formatEther(betAmount)
    // Only log if there's an actual bet
    if (parseFloat(formatted) > 0) {
      console.log(`      💵 getUserBet(${questionId}, ${outcomeIndex}): ${formatted} HBAR (raw: ${betAmount.toString()})`)
    }
    return formatted
  } catch (error) {
    console.error(`❌ Error fetching user bet for question ${questionId}, outcome ${outcomeIndex}:`, error)
    // Return 0 instead of throwing to allow other bets to be checked
    return '0'
  }
}

/**
 * Get all user bets across all markets
 * Returns array of: { questionId, outcomeIndex, amount, marketData }
 */
export async function getAllUserBets(provider, userAddress) {
  try {
    console.log('🔍 getAllUserBets called for:', userAddress)
    const markets = await getAllMarkets(provider)
    console.log('📊 Total markets to check:', markets.length)
    const userBets = []
    
    for (const market of markets) {
      console.log(`\n🎯 Checking market ${market.questionId}: ${market.question}`)
      console.log(`   Outcomes: ${market.outcomes.length}`)
      
      for (let outcomeIndex = 0; outcomeIndex < market.outcomes.length; outcomeIndex++) {
        const amount = await getUserBet(provider, userAddress, market.questionId, outcomeIndex)
        console.log(`   Outcome ${outcomeIndex} (${market.outcomes[outcomeIndex].name}): ${amount} HBAR`)
        
        if (parseFloat(amount) > 0) {
          console.log(`   ✅ Found bet! Adding to userBets`)
          userBets.push({
            questionId: market.questionId,
            outcomeIndex,
            amount,
            outcomeName: market.outcomes[outcomeIndex].name,
            marketData: market
          })
        }
      }
    }
    
    console.log(`\n💰 Total user bets found: ${userBets.length}`)
    return userBets
  } catch (error) {
    console.error('❌ Error fetching all user bets:', error)
    throw error
  }
}

/**
 * Check if user has already claimed winnings for a question
 */
export async function hasUserClaimed(provider, questionId, userAddress) {
  try {
    const contract = getContractWithProvider(provider)
    return await contract.hasClaimed(questionId, userAddress)
  } catch (error) {
    console.error(`Error checking claim status for question ${questionId}:`, error)
    throw error
  }
}

/**
 * Claim winnings for a resolved market
 */
export async function claimWinnings(signer, questionId) {
  try {
    const contract = getContractWithSigner(signer)
    const tx = await contract.claimWinnings(questionId)
    console.log('Claim transaction sent:', tx.hash)
    const receipt = await tx.wait()
    console.log('Claim transaction confirmed:', receipt)
    return receipt
  } catch (error) {
    console.error(`Error claiming winnings for question ${questionId}:`, error)
    throw error
  }
}

/**
 * Place a bet on a market
 */
export async function placeBet(signer, questionId, outcomeIndex, amountInEther) {
  try {
    const contract = getContractWithSigner(signer)
    const amountWei = ethers.parseEther(amountInEther.toString())
    const tx = await contract.placeBet(questionId, outcomeIndex, amountWei, {
      value: amountWei
    })
    console.log('Bet transaction sent:', tx.hash)
    const receipt = await tx.wait()
    console.log('Bet transaction confirmed:', receipt)
    return receipt
  } catch (error) {
    console.error(`Error placing bet on question ${questionId}:`, error)
    throw error
  }
}

/**
 * Calculate potential winnings for a user bet on a resolved market
 */
export function calculateWinnings(userBetAmount, totalWinningPool, totalMarketPool) {
  if (parseFloat(totalWinningPool) === 0) return 0
  return (parseFloat(userBetAmount) * parseFloat(totalMarketPool)) / parseFloat(totalWinningPool)
}
