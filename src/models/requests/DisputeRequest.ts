import { JwtPayload } from 'jsonwebtoken';
import { Media } from '~/constants/enum';
import { ProofType } from '../schemas/DisputeSchema';

export interface CreateDisputeRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
  freelancer_id: string;
  employer_id: string;
}

export interface UpdateDisputeRequest {
  decodeAuthorization: JwtPayload;
  proof: ProofType;
}

export interface ChangeStatusDisputeRequest {
  _id: string;
  status: 'CREATED' | 'PROCESSING' | 'RESOLVED' | 'CANCEL' | 'NEED_MORE_PROOF';
}

export interface CancelDisputeRequest {
  decodeAuthorization: JwtPayload;
  _id: string;
}
