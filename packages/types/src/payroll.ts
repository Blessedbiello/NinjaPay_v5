export type PaymentSchedule = 'weekly' | 'biweekly' | 'monthly' | 'custom';
export type PayrollStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Employee {
  id: string;
  companyId: string;
  walletAddress: string;
  name: string;
  email: string;
  salary: number; // Will be encrypted at rest
  paymentSchedule: PaymentSchedule;
  active: boolean;
  createdAt: Date;
}

export interface PayrollRun {
  id: string;
  companyId: string;
  status: PayrollStatus;
  totalAmount: number; // Will be encrypted
  employeeCount: number;
  scheduledDate: Date;
  executedDate?: Date;
  batchSignature?: string;
  payments: PayrollPayment[];
  createdAt: Date;
}

export interface PayrollPayment {
  id: string;
  payrollRunId: string;
  employeeId: string;
  walletAddress: string;
  encryptedAmount: Buffer;
  amountCommitment: string;
  signature?: string;
  status: PayrollStatus;
  createdAt: Date;
}

export interface PayrollCSVRow {
  wallet_address: string;
  amount: number;
  employee_name?: string;
  employee_id?: string;
  note?: string;
}

export interface BatchTransferParams {
  transfers: Array<{
    to: string;
    amount: number;
  }>;
  senderKeyId: string;
}
