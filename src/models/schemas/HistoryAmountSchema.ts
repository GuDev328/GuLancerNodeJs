import { ObjectId } from 'mongodb';
import { GroupTypes, HistoryAmountTypeEnum } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface HistoryAmountType {
  _id?: ObjectId;
  user_id: ObjectId;
  amount: number;
  type: HistoryAmountTypeEnum;
  created_at?: Date;
}

export default class HistoryAmount {
  _id: ObjectId;
  user_id: ObjectId;
  amount: number;
  type: HistoryAmountTypeEnum;
  created_at: Date;

  constructor(group: HistoryAmountType) {
    this._id = group._id || new ObjectId();
    this.user_id = group.user_id || [];
    this.amount = group.amount || 0;
    this.type = group.type;
    this.created_at = group.created_at || DateVi();
  }
}
