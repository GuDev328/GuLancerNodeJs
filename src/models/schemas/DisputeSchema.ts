import { ObjectId } from 'mongodb';
import { Media } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

export interface ProofType {
  issue_description: string;
  expected_result: string;
  files: Media[];
  share_proof: boolean;
}

interface DisputeType {
  _id?: ObjectId;
  project_id: ObjectId;
  freelancer_id: ObjectId;
  freelancer_proof?: ProofType;
  employer_id: ObjectId;
  employer_proof?: ProofType;
  reporter: ObjectId;
  status?: 'CREATED' | 'PROCESSING' | 'RESOLVED' | 'CANCEL' | 'NEED_MORE_PROOF';
  created_at?: Date;
}

export default class Dispute {
  _id?: ObjectId;
  project_id: ObjectId;
  freelancer_id: ObjectId;
  freelancer_proof: ProofType;
  employer_id: ObjectId;
  employer_proof: ProofType;
  reporter: ObjectId;
  status: 'CREATED' | 'PROCESSING' | 'RESOLVED' | 'CANCEL' | 'NEED_MORE_PROOF';
  created_at?: Date;

  constructor(dispute: DisputeType) {
    this._id = dispute._id || new ObjectId();
    this.project_id = dispute.project_id;
    this.freelancer_id = dispute.freelancer_id;
    this.freelancer_proof = {
      issue_description: '',
      expected_result: '',
      files: [],
      share_proof: false
    };
    this.employer_id = dispute.employer_id;
    this.employer_proof = {
      issue_description: '',
      expected_result: '',
      files: [],
      share_proof: false
    };
    this.reporter = dispute.reporter;
    this.status = 'CREATED';
    this.created_at = DateVi();
  }
}
