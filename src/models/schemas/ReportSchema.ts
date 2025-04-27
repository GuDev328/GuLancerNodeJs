import { ObjectId } from 'mongodb';
import { DateVi } from '~/utils/date-vi';

interface ReportType {
  _id?: ObjectId;
  reporter: ObjectId;
  id_reported: ObjectId;
  type: 'POST' | 'GROUP';
  description: string;
  created_at?: Date;
}

export class Report {
  _id: ObjectId;
  reporter: ObjectId;
  id_reported: ObjectId;
  type: 'POST' | 'GROUP';
  description: string;
  created_at: Date;
  constructor(report: ReportType) {
    this._id = report._id || new ObjectId();
    this.reporter = report.reporter || new ObjectId();
    this.id_reported = report.id_reported || new ObjectId();
    this.type = report.type;
    this.description = report.description || '';
    this.created_at = report.created_at || DateVi();
  }
}
