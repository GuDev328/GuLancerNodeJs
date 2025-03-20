import { ObjectId } from 'mongodb';

export interface Device {
  _id?: ObjectId;
  fingerprint: string;
  user_id: ObjectId;
  created_at: Date;
  last_seen: Date;
  is_blocked?: boolean;
}
