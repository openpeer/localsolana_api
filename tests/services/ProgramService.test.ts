import { PublicKey, Transaction } from "@solana/web3.js";
import { ProgramService } from "../../services/ProgramService";

describe("ProgramService", () => {
  let programService: ProgramService;

  beforeEach(() => {
    // Environment variables are set in setup.ts
    // We don't need to set them here anymore as they're already set
    programService = ProgramService.getInstance();
  });

  describe("getInstance", () => {
    it("should return the same instance on multiple calls", () => {
      const instance1 = ProgramService.getInstance();
      const instance2 = ProgramService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe("buildReleaseFundsTransaction", () => {
    it("should build a valid transaction", async () => {
      const orderId = "test-order-id";
      const seller = new PublicKey(process.env.TEST_SELLER_PUBKEY!);
      const buyer = new PublicKey(process.env.TEST_BUYER_PUBKEY!);
      const token = new PublicKey(process.env.TEST_USDT_TOKEN!);
      const order = {
        dataValues: {
          status: 1
        }
      };

      const tx = await programService.buildReleaseFundsTransaction({
        orderId,
        seller,
        buyer,
        token,
        order
      });

      expect(tx).toBeInstanceOf(Transaction);
      expect(tx.instructions.length).toBeGreaterThan(0);
    });

    it("should throw error for invalid order data", async () => {
      const orderId = "test-order-id";
      const seller = new PublicKey(process.env.TEST_SELLER_PUBKEY!);
      const buyer = new PublicKey(process.env.TEST_BUYER_PUBKEY!);
      const token = new PublicKey(process.env.TEST_USDT_TOKEN!);
      const order = {
        dataValues: {
          status: 2 // Invalid status
        }
      };

      await expect(
        programService.buildReleaseFundsTransaction({
          orderId,
          seller,
          buyer,
          token,
          order
        })
      ).rejects.toThrow("Invalid order status: 2. Expected status: 1");
    });
  });

  describe("PDA Generation", () => {
    it("should generate consistent escrow PDAs", async () => {
      const orderId = "test-order-id";
      const seller = new PublicKey(process.env.TEST_SELLER_PUBKEY!);
      const buyer = new PublicKey(process.env.TEST_BUYER_PUBKEY!);
      const token = new PublicKey(process.env.TEST_USDT_TOKEN!);
      const order = {
        dataValues: {
          status: 1
        }
      };

      const tx1 = await programService.buildReleaseFundsTransaction({
        orderId,
        seller,
        buyer,
        token,
        order
      });

      const tx2 = await programService.buildReleaseFundsTransaction({
        orderId,
        seller,
        buyer,
        token,
        order
      });

      expect(tx1.instructions[0].keys[0].pubkey.toBase58())
        .toBe(tx2.instructions[0].keys[0].pubkey.toBase58());
    });

    it("should generate consistent escrow state PDAs", async () => {
      const orderId = "test-order-id";
      const seller = new PublicKey(process.env.TEST_SELLER_PUBKEY!);
      const buyer = new PublicKey(process.env.TEST_BUYER_PUBKEY!);
      const token = new PublicKey(process.env.TEST_USDT_TOKEN!);
      const order = {
        dataValues: {
          status: 1
        }
      };

      const tx1 = await programService.buildReleaseFundsTransaction({
        orderId,
        seller,
        buyer,
        token,
        order
      });

      const tx2 = await programService.buildReleaseFundsTransaction({
        orderId,
        seller,
        buyer,
        token,
        order
      });

      expect(tx1.instructions[0].keys[1].pubkey.toBase58())
        .toBe(tx2.instructions[0].keys[1].pubkey.toBase58());
    });
  });
}); 