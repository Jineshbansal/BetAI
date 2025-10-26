import { runHederaAgent } from './hedera_agent.js';

async function testAgent() {
  try {
    console.log('🧪 Testing Hedera Agent...');
    
    const agent = await runHederaAgent("Place a bet of 10 HBAR on contract 0.0.7100616 for question 1, outcome 0");
    
    console.log('Agent:', agent);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAgent();
