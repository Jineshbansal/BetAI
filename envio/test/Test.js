
const assert = require("assert");
const { TestHelpers } = require("generated");
const { MockDb, ParimutuelPredictionMarket } = TestHelpers;

describe("ParimutuelPredictionMarket contract BetPlaced event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ParimutuelPredictionMarket contract BetPlaced event
  const event = ParimutuelPredictionMarket.BetPlaced.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ParimutuelPredictionMarket_BetPlaced is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ParimutuelPredictionMarket.BetPlaced.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualParimutuelPredictionMarketBetPlaced = mockDbUpdated.entities.ParimutuelPredictionMarket_BetPlaced.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedParimutuelPredictionMarketBetPlaced = {
      id:`${event.chainId}_${event.block.number}_${event.logIndex}`,
      questionId: event.params.questionId,
      user: event.params.user,
      outcomeIndex: event.params.outcomeIndex,
      amount: event.params.amount,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(
      actualParimutuelPredictionMarketBetPlaced,
      expectedParimutuelPredictionMarketBetPlaced,
      "Actual ParimutuelPredictionMarketBetPlaced should be the same as the expectedParimutuelPredictionMarketBetPlaced"
    );
  });
});
