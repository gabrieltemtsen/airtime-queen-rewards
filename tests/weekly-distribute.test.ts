import { describe, it, expect, beforeAll, afterAll, mock, jest } from 'bun:test';
import { parseEther } from 'viem';

// Define mock data
const mockUsers = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  wallet_address: `0x${(i + 1).toString().padStart(40, '0')}`,
}));

// Mock the database module using bun:test
mock.module('../src/db/db', () => ({
  db: {
    selectFrom: jest.fn((table: string) => {
      if (table === 'users') {
        return {
          selectAll: jest.fn().mockReturnThis(),
          execute: jest.fn().mockResolvedValue(mockUsers),
        };
      }
      if (table === 'job_runs') {
        return {
          select: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          executeTakeFirst: jest.fn().mockResolvedValue({ last_run_timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }),
        };
      }
      return { execute: jest.fn().mockResolvedValue([]) };
    }),
    insertInto: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock the blockchain utils module using bun:test
mock.module('../src/utils/blockchain', () => ({
  getTwabs: jest.fn().mockResolvedValue(Array(100).fill(parseEther('50'))),
  disperseTokens: jest.fn().mockResolvedValue('0xhash'),
  depositZarp: jest.fn().mockResolvedValue('0xhash'),
}));

// Import the modules that will use the mocks
import { runWeeklyDistribution } from '../src/weekly-distribute';
import { config } from '../src/config/config';
import { db } from '../src/db/db';
import { getTwabs, disperseTokens } from '../src/utils/blockchain';

describe('Weekly Rewards Distribution', () => {
  beforeAll(() => {
    // Use fake timers to control the passage of time
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-27T10:00:00Z'));
  });

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  it('should distribute rewards correctly', async () => {
    await runWeeklyDistribution();

    const now = Math.floor(Date.now() / 1000);

    // 1. Verify database interactions
    expect(db.selectFrom).toHaveBeenCalledWith('users');
    expect(db.selectFrom).toHaveBeenCalledWith('job_runs');

    // 2. Verify TWABs were fetched
    expect(getTwabs).toHaveBeenCalledWith(
      mockUsers.map(u => u.wallet_address as `0x${string}`),
      expect.any(Number),
      now
    );

    // 3. Verify rewards were calculated and dispersed
    const SCALING_FACTOR = 10n ** 18n;
    const weeklyRate = (BigInt(config.rewardApyBps) * SCALING_FACTOR) / 520000n;
    const expectedReward = (parseEther('50') * weeklyRate) / SCALING_FACTOR;
    expect(disperseTokens).toHaveBeenCalledWith(
      config.vault,
      mockUsers.map(u => u.wallet_address as `0x${string}`),
      Array(100).fill(expectedReward)
    );

    // 4. Verify the new job run was saved
    expect(db.insertInto).toHaveBeenCalledWith('job_runs');
    expect(db.values).toHaveBeenCalledWith({ last_run_timestamp: expect.any(Date) });
  });
});