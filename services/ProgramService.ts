import { Program, AnchorProvider, Idl, IdlAccounts, IdlInstruction } from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { getShyftInstance } from "../utils/shyft";
import { logEscrowOperation, logEscrowError } from "../utils/logger";
import * as localSolanaMigrateIDL from "../idl/local_solana_migrate.json";

// Define the program's IDL type
interface LocalSolanaMigrateIDL extends Idl {
  version: "0.1.0";
  name: "local_solana_migrate";
  instructions: IdlInstruction[];
  metadata: {
    name: string;
    version: string;
    spec: string;
    address: string;
  };
}

// Define accounts for release funds instruction
interface ReleaseFundsAccounts {
  escrowState: PublicKey;
  escrow: PublicKey;
  seller: PublicKey;
  buyer: PublicKey;
  feeRecipient: PublicKey;
  feePayer: PublicKey;
  tokenProgram: PublicKey;
  mintAccount: PublicKey;
  sellerTokenAccount?: PublicKey;
  buyerTokenAccount?: PublicKey;
  systemProgram: PublicKey;
  rent: PublicKey;
}

interface Order {
  dataValues: {
    status: number;
  };
}

// Use a single parameter object for buildReleaseFundsTransaction
export interface ReleaseFundsParams {
  orderId: string;
  seller: PublicKey;
  buyer: PublicKey;
  token: PublicKey;
  order: Order;
}

interface TokenAccounts {
  escrowTokenAccount: PublicKey | null;
  buyerTokenAccount: PublicKey | null;
  feeRecipientTokenAccount: PublicKey | null;
}

export class ProgramService {
  private static instance: ProgramService;
  private connection: Connection;
  private program: Program<LocalSolanaMigrateIDL>;

  private constructor() {
    this.connection = getShyftInstance().connection;
    
    const provider = new AnchorProvider(
      this.connection,
      {
        publicKey: new PublicKey(process.env.FEE_PAYER!),
        signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
        signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
      },
      { commitment: 'confirmed' }
    );

    const programId = new PublicKey(process.env.LOCALSOLANA_PROGRAM_ID!);
    
    // Initialize program with Anchor and proper typing
    const idl = {
      ...localSolanaMigrateIDL,
      metadata: {
        name: "local_solana_migrate",
        version: "0.1.0",
        spec: "0.1.0",
        address: process.env.LOCALSOLANA_PROGRAM_ID!
      }
    } as LocalSolanaMigrateIDL;
    
    this.program = new Program<LocalSolanaMigrateIDL>(idl, provider, programId);

    logEscrowOperation("programService:init", {
      rpcUrl: process.env.SOLANA_RPC_URL,
      programId: programId.toBase58(),
      usingShyft: !!getShyftInstance().connection
    });
  }

  public static getInstance(): ProgramService {
    if (!ProgramService.instance) {
      ProgramService.instance = new ProgramService();
    }
    return ProgramService.instance;
  }

  public async buildReleaseFundsTransaction(params: ReleaseFundsParams): Promise<Transaction> {
    try {
      const { orderId, seller, buyer, token, order } = params;
      
      logEscrowOperation("buildReleaseFundsTransaction:start", {
        orderId,
        seller: seller.toBase58(),
        buyer: buyer.toBase58(),
        token: token.toBase58(),
        orderStatus: order.dataValues.status
      });

      if (order.dataValues.status !== 1) {
        const error = new Error(`Invalid order status: ${order.dataValues.status}. Expected status: 1`);
        logEscrowError("buildReleaseFundsTransaction:invalidStatus", error);
        throw error;
      }

      const accounts = await this.getRequiredAccounts(orderId, seller, buyer, token);
      
      logEscrowOperation("buildReleaseFundsTransaction:accounts", {
        escrowState: accounts.escrowState.toBase58(),
        escrow: accounts.escrow.toBase58(),
        seller: accounts.seller.toBase58(),
        buyer: accounts.buyer.toBase58(),
        feeRecipient: accounts.feeRecipient.toBase58(),
        feePayer: accounts.feePayer.toBase58(),
        tokenProgram: accounts.tokenProgram.toBase58(),
        mintAccount: accounts.mintAccount.toBase58(),
        sellerTokenAccount: accounts.sellerTokenAccount?.toBase58(),
        buyerTokenAccount: accounts.buyerTokenAccount?.toBase58(),
        systemProgram: accounts.systemProgram.toBase58(),
        rent: accounts.rent.toBase58()
      });

      // Use Anchor's methods builder as shown in the docs
      const tx = await this.program.methods
        .releaseFunds(orderId)
        .accounts({
          escrowState: accounts.escrowState,
          escrow: accounts.escrow,
          seller: accounts.seller,
          buyer: accounts.buyer,
          feeRecipient: accounts.feeRecipient,
          feePayer: accounts.feePayer,
          tokenProgram: accounts.tokenProgram,
          mintAccount: accounts.mintAccount,
          sellerTokenAccount: accounts.sellerTokenAccount,
          buyerTokenAccount: accounts.buyerTokenAccount,
          systemProgram: accounts.systemProgram,
          rent: accounts.rent
        })
        .transaction();

      logEscrowOperation("buildReleaseFundsTransaction:success", {
        orderId,
        seller: seller.toBase58(),
        buyer: buyer.toBase58()
      });

      return tx;
    } catch (error) {
      logEscrowError("buildReleaseFundsTransaction:error", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  private async getRequiredAccounts(
    orderId: string,
    seller: PublicKey,
    buyer: PublicKey,
    token: PublicKey
  ): Promise<ReleaseFundsAccounts> {
    const [escrowState] = await this.getEscrowStatePDA(orderId);
    const [escrow] = await this.getEscrowPDA(orderId);
    const feeRecipient = new PublicKey(process.env.FEE_RECIPIENT!);
    const feePayer = new PublicKey(process.env.FEE_PAYER!);

    let sellerTokenAccount: PublicKey | undefined;
    let buyerTokenAccount: PublicKey | undefined;

    if (token && token !== PublicKey.default) {
      sellerTokenAccount = await getAssociatedTokenAddress(token, seller);
      buyerTokenAccount = await getAssociatedTokenAddress(token, buyer);
    }

    return {
      escrowState,
      escrow,
      seller,
      buyer,
      feeRecipient,
      feePayer,
      tokenProgram: TOKEN_PROGRAM_ID,
      mintAccount: token,
      sellerTokenAccount,
      buyerTokenAccount,
      systemProgram: PublicKey.default,
      rent: PublicKey.default
    };
  }

  private async getEscrowPDA(orderId: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), Buffer.from(orderId)],
      this.program.programId
    );
  }

  private async getEscrowStatePDA(orderId: string): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_state"), Buffer.from(orderId)],
      this.program.programId
    );
  }
} 