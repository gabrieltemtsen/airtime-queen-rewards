
import { db } from './db/db';
import { getTwabs, depositZarp, disperseTokens } from './utils/blockchain';
import { calculateWeeklyReward } from './utils/math';
import { config } from './config/config';

export async function runWeeklyDistribution() {
  console.log('Starting weekly rewards distribution...');

  try {
    const users = await db.selectFrom('users').selectAll().execute();
    const lastRun = await db.selectFrom('job_runs').select('last_run_timestamp').orderBy('last_run_timestamp', 'desc').limit(1).executeTakeFirst();

    const startTime = lastRun ? Math.floor(new Date(lastRun.last_run_timestamp).getTime() / 1000) : 0;
    const endTime = Math.floor(Date.now() / 1000);

    const userAddresses = users.map(u => u.wallet_address as `0x${string}`);
    const twabs = await getTwabs(userAddresses, startTime, endTime);

    const rewards: any = twabs.map(twab => calculateWeeklyReward(twab, config.rewardApyBps));
    const totalRewards = rewards.reduce((acc: any, val: any) => acc + val, 0n);

    // Check if vault has enough balance, if not, deposit ZARP
    // This is a simplified check, a real implementation would check the balance of the rewards wallet
    if (totalRewards > 0) { // A more realistic check would be against the actual vault balance
        // await depositZarp(totalRewards);
    }

    const recipients = userAddresses.filter((_, i) => rewards[i] > 0);
    const amounts = rewards.filter((r: any) => r > 0);

    if (recipients.length > 0) {
      await disperseTokens(config.vault, recipients, amounts);
      console.log(`Successfully dispersed ${totalRewards} tokens to ${recipients.length} users.`);
    } else {
      console.log('No rewards to distribute this week.');
    }

    await db.insertInto('job_runs').values({ id: Date.now(), last_run_timestamp: new Date() }).execute();
    console.log('Weekly rewards distribution finished successfully.');

  } catch (error) {
    console.error('Error during weekly rewards distribution:', error);
  }
}

runWeeklyDistribution();
