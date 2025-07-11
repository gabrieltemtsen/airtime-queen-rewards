
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  anvilUrl: process.env.ANVIL_URL || 'http://localhost:8545',
  rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org',
  chainId: parseInt(process.env.CHAIN_ID || '8453'),
  databaseUrl: process.env.DATABASE_URL || '',
  privateKey: (process.env.PRIVATE_KEY as `0x${string}`) || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  rewardApyBps: parseInt(process.env.REWARD_APY_BPS || '500'),
  multicall3: process.env.MULTICALL3 as `0x${string}`,
  twabController: process.env.TWAB_CONTROLLER as `0x${string}`,
  vault: process.env.VAULT as `0x${string}`,
  zarp: process.env.ZARP as `0x${string}`,
  disperse: process.env.DISPERSE as `0x${string}`,
};
