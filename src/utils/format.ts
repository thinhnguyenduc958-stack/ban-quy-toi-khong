export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface BankOption {
  bin: string;
  code: string;
  name: string;
  shortName: string;
}

export const VIETNAM_BANKS: BankOption[] = [
  { bin: '970415', code: 'ICB', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công Thương Việt Nam (VietinBank)' },
  { bin: '970436', code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương (Vietcombank)' },
  { bin: '970422', code: 'MB', shortName: 'MB Bank', name: 'Ngân hàng Quân Đội (MB Bank)' },
  { bin: '970407', code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương (Techcombank)' },
  { bin: '970416', code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu (ACB)' },
  { bin: '970432', code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)' },
  { bin: '970423', code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong (TPBank)' },
  { bin: '970418', code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển (BIDV)' },
  { bin: '970405', code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp (Agribank)' },
  { bin: '970403', code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)' },
  { bin: '970441', code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc Tế (VIB)' },
  { bin: '970437', code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM (HDBank)' },
  { bin: '970448', code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông (OCB)' },
  { bin: '970426', code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải (MSB)' },
];
