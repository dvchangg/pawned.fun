import React, { createContext, useContext, ReactNode } from "react";
import { useWalletState } from "../hooks/use-wallet";
import { PublicKey } from "@solana/web3.js";
import { WalletAdapter } from "../lib/solana";

interface WalletContextType {
  wallet: WalletAdapter | null;
  connected: boolean;
  connecting: boolean;
  publicKey: PublicKey | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const walletState = useWalletState();

  return (
    <WalletContext.Provider value={walletState}>
      {children}
    </WalletContext.Provider>
  );
}