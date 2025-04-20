import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface EvaluationType {
  _id?: ObjectId;
  user_id: ObjectId;
  reviewer_id: ObjectId;
  content: string;
  star: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Evaluation {
  _id: ObjectId;
  user_id: ObjectId;
  reviewer_id: ObjectId;
  content: string;
  star: number;
  created_at: Date;
  updated_at: Date;

  constructor(evaluate: EvaluationType) {
    this._id = evaluate._id || new ObjectId();
    this.user_id = evaluate.user_id || new ObjectId();
    this.reviewer_id = evaluate.reviewer_id || new ObjectId();
    this.content = evaluate.content || '';
    this.star = evaluate.star || 5.0;
    this.created_at = evaluate.created_at || DateVi();
    this.updated_at = evaluate.updated_at || DateVi();
  }
}
