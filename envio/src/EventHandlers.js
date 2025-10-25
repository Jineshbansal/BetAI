/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
const {
 ParimutuelPredictionMarket,
} = require("generated");

ParimutuelPredictionMarket.BetPlaced.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    questionId: event.params.questionId,
    user: event.params.user,
    outcomeIndex: event.params.outcomeIndex,
    amount: event.params.amount,
  };

  context.ParimutuelPredictionMarket_BetPlaced.set(entity);
});


ParimutuelPredictionMarket.MarketResolved.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    questionId: event.params.questionId,
    winningOutcome: event.params.winningOutcome,
  };

  context.ParimutuelPredictionMarket_MarketResolved.set(entity);
});


ParimutuelPredictionMarket.QuestionAdded.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    questionId: event.params.questionId,
    question: event.params.question,
    outcomeNames: event.params.outcomeNames,
    endTime: event.params.endTime,
  };

  context.ParimutuelPredictionMarket_QuestionAdded.set(entity);
});


ParimutuelPredictionMarket.WinningsClaimed.handler(async ({event, context}) => {
  const entity = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    questionId: event.params.questionId,
    user: event.params.user,
    amount: event.params.amount,
  };

  context.ParimutuelPredictionMarket_WinningsClaimed.set(entity);
});

