import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Solana configuration
export const SOLANA_NETWORK = "devnet";
export const RPC_ENDPOINT = "https://api.devnet.solana.com";

export const connection = new Connection(RPC_ENDPOINT, "confirmed");

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions?: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export async function createWagerTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amount: number
): Promise<Transaction> {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  );

  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;

  return transaction;
}

export async function getBalance(publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  return balance / LAMPORTS_PER_SOL;
}

export function formatSolAmount(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return (num / LAMPORTS_PER_SOL).toFixed(4);
}

export function parseSolAmount(amount: string): number {
  return parseFloat(amount) * LAMPORTS_PER_SOL;
}