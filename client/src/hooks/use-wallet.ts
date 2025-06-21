import { useState, useEffect, createContext, useContext } from "react";
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

// Mock wallet for development
class MockWallet implements WalletAdapter {
  publicKey: PublicKey | null = null;
  connected: boolean = false;

  async connect(): Promise<void> {
    // Generate a random public key for demo
    const mockKeyArray = new Uint8Array(32);
    crypto.getRandomValues(mockKeyArray);
    this.publicKey = new PublicKey(mockKeyArray);
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.publicKey = null;
    this.connected = false;
  }
}

export function useWalletState() {
  const [wallet] = useState<WalletAdapter>(new MockWallet());
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    setConnected(wallet.connected);
    setPublicKey(wallet.publicKey);
  }, [wallet]);

  const connect = async () => {
    try {
      setConnecting(true);
      await wallet.connect();
      setConnected(wallet.connected);
      setPublicKey(wallet.publicKey);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await wallet.disconnect();
      setConnected(wallet.connected);
      setPublicKey(wallet.publicKey);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  return {
    wallet,
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
  };
}