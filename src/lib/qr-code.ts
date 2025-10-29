import QRCode from 'qrcode';
import { generateTransferContent } from './utils';

export interface QRCodeData {
  bankAccount: string;
  bankName: string;
  accountName: string;
  amount: number;
  transferContent: string;
}

export async function generateQRCode(data: QRCodeData): Promise<string> {
  // VietQR API format - Generate QR image URL
  // Format: https://img.vietqr.io/image/[BANK_BIN]-[ACCOUNT_NUMBER]-[TEMPLATE].jpg?amount=[AMOUNT]&addInfo=[MESSAGE]
  
  // Map bank name to BIN code (common banks)
  const bankBinMap: Record<string, string> = {
    'vietcombank': '970436',
    'vcb': '970436',
    'techcombank': '970407',
    'tcb': '970407',
    'tpbank': '970423',
    'tpb': '970423',
    'mbbank': '970422',
    'mb': '970422',
    'acb': '970416',
    'vietinbank': '970415',
    'viettinbank': '970415',
    'agribank': '970405',
    'sacombank': '970403',
    'bidv': '970418',
  };
  
  const bankKey = data.bankName.toLowerCase().replace(/\s+/g, '');
  const bankBin = bankBinMap[bankKey] || '970436'; // Default to VCB if not found
  
  // Use VietQR API to generate QR code image
  const vietQRUrl = `https://img.vietqr.io/image/${bankBin}-${data.bankAccount}-compact.jpg?amount=${data.amount}&addInfo=${encodeURIComponent(data.transferContent)}&accountName=${encodeURIComponent(data.accountName)}`;
  
  // Return the VietQR URL directly (it's already a QR code image)
  return vietQRUrl;
}

export async function generateDepositQRCode(
  userId: string,
  amount: number,
  bankInfo: {
    bank: string;
    account: string;
    name: string;
  }
): Promise<{ qrCode: string; transferContent: string }> {
  const transferContent = generateTransferContent(userId, amount);
  
  const qrData: QRCodeData = {
    bankAccount: bankInfo.account,
    bankName: bankInfo.bank,
    accountName: bankInfo.name,
    amount,
    transferContent,
  };
  
  const qrCode = await generateQRCode(qrData);
  
  return {
    qrCode,
    transferContent,
  };
}



