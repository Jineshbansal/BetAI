// hederaAgent.js
import dotenv from 'dotenv';
dotenv.config();

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createToolCallingAgent } from 'langchain/agents';
import { HederaLangchainToolkit } from 'hedera-agent-kit';
import { coreAccountPlugin, coreQueriesPlugin } from 'hedera-agent-kit';
import {
  Client,
  PrivateKey,
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  ContractId,
} from '@hashgraph/sdk';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatGroq } from '@langchain/groq';

// Define the reusable Hedera contract execution tool
const placeBetTool = new DynamicStructuredTool({
  name: "place_bet_tool",
  description: "Executes a Hedera smart contract function 'placeBet'. Accepts contractId, questionId, outcomeIndex, and betAmount (HBAR).",
  schema: {
    type: "object",
    properties: {
      contractId: { type: "string", description: "Hedera contract ID (e.g., 0.0.7100616)" },
      questionId: { type: "number", description: "Unique question ID for the bet" },
      outcomeIndex: { type: "number", description: "Outcome index of the bet" },
      betAmount: { type: "number", description: "Bet amount in HBAR" }
    },
    required: ["contractId", "questionId", "outcomeIndex", "betAmount"]
  },
  async func({ contractId, questionId, outcomeIndex, betAmount }) {
    const client = Client.forTestnet().setOperator(
      process.env.HEDERA_ACCOUNT_ID,
      PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY)
    );

    const amountTinybars = Hbar.from(betAmount).toTinybars();

    const tx = new ContractExecuteTransaction()
      .setContractId(ContractId.fromString(contractId))
      .setGas(200000)
      .setPayableAmount(Hbar.fromTinybars(amountTinybars))
      .setFunction(
        'placeBet',
        new ContractFunctionParameters()
          .addUint256(questionId)
          .addUint256(outcomeIndex)
          .addUint256(amountTinybars)
      );

    const submitTx = await tx.execute(client);
    const receipt = await submitTx.getReceipt(client);
    return `Transaction completed with status: ${receipt.status.toString()}`;
  }
});

// Select large-language model provider
function createLLM() {
  if (process.env.GROQ_API_KEY) {
    return new ChatGroq({ model: 'llama-3.3-70b-versatile' });
  }
  throw new Error("Missing GROQ_API_KEY in environment variables.");
}

// Main reusable function
export async function runHederaAgent(promptText) {
  try {
    const llm = createLLM();

    const client = Client.forTestnet().setOperator(
      process.env.HEDERA_ACCOUNT_ID,
      PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY)
    );

    // Initialize Hedera Toolkit
    const toolkit = new HederaLangchainToolkit({
      client,
      configuration: {
        plugins: [coreAccountPlugin, coreQueriesPlugin],
      },
    });

    // Fixed prompt template with required agent_scratchpad
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a Hedera AI agent capable of performing blockchain operations and contract executions.'],
      ['human', '{input}'],
      ['placeholder', '{agent_scratchpad}'],
    ]);

    const tools = [...toolkit.getTools(), placeBetTool];
    const agent = createToolCallingAgent({ llm, tools, prompt });
    const executor = new AgentExecutor({ agent, tools });

    const response = await executor.invoke({ input: promptText });

    // Return structured response
    return {
      success: true,
      input: promptText,
      result: response,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
    };
  }
}

// Local dev test (run this file directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  const input = process.argv.slice(2).join(" ") || "Place a bet of 10 HBAR on contract 0.0.7100616 for question 1, outcome 0";
  runHederaAgent(input)
    .then(res => console.log(JSON.stringify(res, null, 2)))
    .catch(err => console.error("Error:", err));
}
