
import { describe, it, expect, beforeAll, afterAll, jest, mock } from 'bun:test';
import { runWeeklyDistribution } from '../src/weekly-distribute';
import * as blockchainUtils from '../src/utils/blockchain';
import * as dbModule from '../src/db/db';
import { calculateWeeklyReward } from '../src/utils/math';
import { parseEther } from 'viem';
import { config } from '../src/config/config';

const randomAddress = () => `0x${[...Array(40)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;

describe('End-to-End Test (Mocked)', () => {
  let users: { id: number, wallet_address: string }[];
  let twabs: bigint[];

  beforeAll(() => {
    // 1. Seed the database with 100 random accounts
    users = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      wallet_address: randomAddress(),
    }));

    // 2. Sets up a local anvil Base fork that sets the twab state of those 100 accounts to random amounts between R10 and R100
    twabs = users.map(() => parseEther(`${Math.random() * 90 + 10}`));

    // Mock database interactions
    mock.module('../src/db/db', () => ({
      db: {
        selectFrom: jest.fn().mockReturnValue({
          selectAll: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(users),
          }),
          select: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                executeTakeFirst: jest.fn().mockResolvedValue({ last_run_timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) })
              })
            })
          })
        }),
        insertInto: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            execute: jest.fn()
          })
        })
      }
    }));

    // Mock blockchain interactions
    mock.module('../src/utils/blockchain', () => ({
      getTwabs: jest.fn().mockResolvedValue(twabs),
      disperseTokens: jest.fn().mockResolvedValue('0xmockhash'),
    }));
  });

  it('should distribute rewards correctly', async () => {
    const { disperseTokens } = require('../src/utils/blockchain');
    const { db } = require('../src/db/db');

    await runWeeklyDistribution();

    // Verify that the correct users were fetched from the database
    expect(db.selectFrom).toHaveBeenCalledWith('users');

    // Verify that the twabs were fetched for the correct users
    const { getTwabs } = require('../src/utils/blockchain');
    expect(getTwabs).toHaveBeenCalled();

    // Verify that the rewards were dispersed to the correct users with the correct amounts
    expect(disperseTokens).toHaveBeenCalled();
    const [token, recipients, amounts] = disperseTokens.mock.calls[0];

    expect(token).toBe(config.vault);
    expect(recipients.length).toBe(100);
    expect(amounts.length).toBe(100);

    // 3. Runs the script on the local anvil network and samples 10 of the target addresses to check if they got the right amount distributed
    for (let i = 0; i < 10; i++) {
      const userAddress = recipients[i];
      const userIndex = users.findIndex(u => u.wallet_address === userAddress);
      const expectedReward = calculateWeeklyReward(twabs[userIndex], config.rewardApyBps);
      expect(amounts[i]).toBe(expectedReward);
    }
  });
});
