import { ObjectId } from 'mongodb';

interface EvaluationType {
  _id?: ObjectId;
  user_id: ObjectId;
  deverloper_id: ObjectId;
  content: string;
  star: number;
  created_at?: Date;
  updated_at?: Date;
}

export default class Evaluation {
  _id: ObjectId;
  user_id: ObjectId;
  deverloper_id: ObjectId;
  content: string;
  star: number;
  created_at: Date;
  updated_at: Date;

  constructor(evaluate: EvaluationType) {
    this._id = evaluate._id || new ObjectId();
    this.user_id = evaluate.user_id || new ObjectId();
    this.deverloper_id = evaluate.deverloper_id || new ObjectId();
    this.content = evaluate.content || '';
    this.star = evaluate.star || 0;
    this.created_at = evaluate.created_at || new Date();
    this.updated_at = evaluate.updated_at || new Date();
  }
}
