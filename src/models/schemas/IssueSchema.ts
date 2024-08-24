import { ObjectId } from 'mongodb';
import { IssuesStatus } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface IssueType {
  _id?: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  status: IssuesStatus;
  created_at?: Date;
}

export default class Issue {
  _id: ObjectId;
  user_id: ObjectId;
  project_id: ObjectId;
  status: IssuesStatus;
  created_at: Date;

  constructor(issue: IssueType) {
    this._id = issue._id || new ObjectId();
    this.user_id = issue.user_id || new ObjectId();
    this.project_id = issue.project_id || new ObjectId();
    this.status = issue.status || IssuesStatus.Processing;
    this.created_at = issue.created_at || DateVi();
  }
}
