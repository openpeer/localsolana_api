import { PublicKey } from "@solana/web3.js";

export interface Order {
  dataValues: {
    status: number;
    seller_id: string;
    buyer_id: string;
    token_amount?: string;
  };
}

export interface ReleaseFundsParams {
  orderId: string;
  seller: PublicKey;
  buyer: PublicKey;
  token: PublicKey;
  order: Order;
}

export interface TokenAccounts {
  escrowTokenAccount: PublicKey;
  buyerTokenAccount: PublicKey;
  feeRecipientTokenAccount: PublicKey;
}

export interface RequiredAccounts {
  escrowState: PublicKey;
  escrow: PublicKey;
  seller: PublicKey;
  buyer: PublicKey;
  feeRecipient: PublicKey;
  feePayer: PublicKey;
  tokenProgram: PublicKey;
  mintAccount: PublicKey;
  escrowTokenAccount: PublicKey;
  buyerTokenAccount: PublicKey;
  feeRecipientTokenAccount: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
  rent: PublicKey;
} 