
import { createPublicClient, http, createWalletClient, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { config } from '../config/config';
import { VAULT_ABI, DISPERSE_ABI, ZARP_TOKEN_ABI, TWAB_CONTROLLER_ABI } from '../config/constants';

const publicClient = createPublicClient({
  chain: base,
  transport: http(config.rpcUrl),
});

const walletClient = createWalletClient({
  chain: base,
  transport: http(config.rpcUrl),
  account: privateKeyToAccount(config.privateKey),
}).extend(publicActions);

/**
 * Deposits ZARP tokens into the vault.
 * @param amount - The amount of ZARP to deposit.
 */
export async function depositZarp(amount: bigint) {
  const { request } = await walletClient.simulateContract({
    address: config.zarp,
    abi: ZARP_TOKEN_ABI,
    functionName: 'approve',
    args: [config.vault, amount],
  });
  await walletClient.writeContract(request);

  const { request: depositRequest } = await walletClient.simulateContract({
    address: config.vault,
    abi: VAULT_ABI,
    functionName: 'deposit',
    args: [amount],
  });
  return walletClient.writeContract(depositRequest);
}

/**
 * Disperses tokens to multiple recipients.
 * @param token - The token address to disperse.
 * @param recipients - An array of recipient addresses.
 * @param amounts - An array of amounts to disperse.
 */
export async function disperseTokens(token: `0x${string}`, recipients: `0x${string}`[], amounts: bigint[]) {
  const { request } = await walletClient.simulateContract({
    address: config.disperse,
    abi: DISPERSE_ABI,
    functionName: 'disperseTokenSimple',
    args: [token, recipients, amounts],
  });
  return walletClient.writeContract(request);
}

/**
 * Fetches TWABs for multiple users in batches using multicall.
 * @param users - An array of user addresses.
 * @param startTime - The start time for the TWAB calculation.
 * @param endTime - The end time for the TWAB calculation.
 * @returns A promise that resolves to an array of TWABs.
 */
export async function getTwabs(users: `0x${string}`[], startTime: number, endTime: number): Promise<bigint[]> {
  const calls = users.map((user) => ({
    address: config.twabController,
    abi: TWAB_CONTROLLER_ABI,
    functionName: 'getTwabBetween',
    args: [config.vault, user, BigInt(startTime), BigInt(endTime)],
  }));

  const results = await publicClient.multicall({
    contracts: calls,
    multicallAddress: config.multicall3,
  });

  return results.map((result) => result.result as bigint);
}
