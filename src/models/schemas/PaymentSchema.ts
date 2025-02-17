import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface PaymentType {
  _id?: ObjectId;
  user_id: ObjectId;
  amount: number;
  paymentMethod?: string;
  vnp_TransactionNo?: string;
  vnp_ResponseCode?: string;
  vnp_PayDate?: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  created_at?: Date;
  updatedAt?: Date;
}

export default class Payment {
  _id: ObjectId;
  user_id: ObjectId;
  amount: number;
  paymentMethod: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_PayDate: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  created_at: Date;
  updatedAt: Date;

  constructor(payment: PaymentType) {
    this._id = payment._id || new ObjectId();
    this.user_id = payment.user_id;
    this.amount = payment.amount;
    this.paymentMethod = payment.paymentMethod || '';
    this.vnp_TransactionNo = payment.vnp_TransactionNo || '';
    this.vnp_ResponseCode = payment.vnp_ResponseCode || '';
    this.vnp_PayDate = payment.vnp_PayDate || '';
    this.status = payment.status || 'PENDING';
    this.created_at = payment.created_at || DateVi();
    this.updatedAt = payment.updatedAt || DateVi();
  }
}
