
/**
 * Calculates the weekly reward based on the annual percentage yield (APY) in basis points.
 * @param twab - The time-weighted average balance.
 * @param rewardApyBps - The reward APY in basis points.
 * @returns The calculated weekly reward.
 */
export function calculateWeeklyReward(twab: bigint, rewardApyBps: number): bigint {
  const SCALING_FACTOR = 10n ** 18n; // For precision, similar to Ether
  const weeklyRate = (BigInt(rewardApyBps) * SCALING_FACTOR) / 520000n; // 52 weeks * 10000 bps
  return (twab * weeklyRate) / SCALING_FACTOR;
}
