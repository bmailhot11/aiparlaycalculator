const { z } = require('zod');

// Basic odds validation
const oddsSchema = z.union([
  z.number().finite().refine(val => val !== 0, "Odds cannot be zero"),
  z.string().transform((val, ctx) => {
    const num = parseFloat(val);
    if (isNaN(num) || num === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid odds format"
      });
      return z.NEVER;
    }
    return num;
  })
]);

// Odds format validation
const oddsFormatSchema = z.enum(['american', 'decimal', 'auto']).default('auto');

// Single outcome schema
const outcomeSchema = z.object({
  book: z.string().min(1, "Book name required"),
  outcome: z.string().optional(),
  odds: oddsSchema,
  format: oddsFormatSchema.optional(),
  isPush: z.boolean().default(false)
});

// Book data schema
const bookSchema = z.object({
  name: z.string().min(1, "Book name required"),
  odds: z.array(oddsSchema).min(1, "At least one odds value required"),
  format: oddsFormatSchema.optional()
});

// Market data schema for single outcome analysis
const marketDataSchema = z.object({
  market: z.string().optional(),
  outcomes: z.array(z.string()).optional(),
  books: z.array(bookSchema).min(1, "At least one book required").refine(
    (books) => {
      // Check if all books have the same number of outcomes
      const outcomeCount = books[0].odds.length;
      return books.every(book => book.odds.length === outcomeCount);
    },
    "All books must have the same number of outcomes"
  ).refine(
    (books) => {
      // Check if Pinnacle is included
      return books.some(book => book.name.toLowerCase().includes('pinnacle'));
    },
    "Pinnacle must be included for baseline probabilities"
  )
});

// Parlay leg schema
const parlayLegSchema = z.object({
  book: z.string().min(1, "Book name required"),
  outcome: z.string().optional(),
  odds: oddsSchema,
  format: oddsFormatSchema.optional(),
  isPush: z.boolean().default(false),
  trueProbability: z.number().min(0).max(1).optional() // Will be calculated if not provided
});

// Single parlay schema
const parlaySchema = z.object({
  id: z.string().optional(),
  book: z.string().min(1, "Book name required"),
  legs: z.array(parlayLegSchema).min(2, "Parlay must have at least 2 legs"),
  stake: z.number().positive("Stake must be positive").default(1)
});

// Multiple parlays comparison schema
const parlaysComparisonSchema = z.object({
  parlays: z.array(parlaySchema).min(1, "At least one parlay required")
});

// API request schemas
const evCalculationRequestSchema = z.object({
  type: z.enum(['market', 'parlay', 'parlays']),
  data: z.union([
    marketDataSchema,
    parlaySchema,
    parlaysComparisonSchema
  ])
});

// Stake validation
const stakeSchema = z.number().positive("Stake must be positive");

// Probability validation (0-1 range)
const probabilitySchema = z.number().min(0).max(1);

// Validation helper functions
function validateMarketData(data) {
  try {
    return {
      success: true,
      data: marketDataSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || [{ message: error.message }]
    };
  }
}

function validateParlayData(data) {
  try {
    return {
      success: true,
      data: parlaySchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || [{ message: error.message }]
    };
  }
}

function validateParlaysComparison(data) {
  try {
    return {
      success: true,
      data: parlaysComparisonSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || [{ message: error.message }]
    };
  }
}

function validateEVRequest(data) {
  try {
    return {
      success: true,
      data: evCalculationRequestSchema.parse(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || [{ message: error.message }]
    };
  }
}

function validateStake(stake) {
  try {
    return {
      success: true,
      data: stakeSchema.parse(stake)
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || [{ message: error.message }]
    };
  }
}

// Export all schemas and functions
module.exports = {
  // Validation functions
  validateMarketData,
  validateParlayData,
  validateParlaysComparison,
  validateEVRequest,
  validateStake,
  // Schemas
  oddsSchema,
  oddsFormatSchema,
  outcomeSchema,
  bookSchema,
  marketDataSchema,
  parlayLegSchema,
  parlaySchema,
  parlaysComparisonSchema,
  evCalculationRequestSchema,
  stakeSchema,
  probabilitySchema
};