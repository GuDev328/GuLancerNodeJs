import { JwtPayload } from 'jsonwebtoken';
import { Media } from '~/constants/enum';
import { ProofType } from '../schemas/DisputeSchema';

export interface CreateDisputeRequest {
  decodeAuthorization: JwtPayload;
  project_id: string;
  freelancer_id: string;
}

export interface UpdateDisputeRequest {
  decodeAuthorization: JwtPayload;
  proof: ProofType;
}

export interface ChangeStatusDisputeRequest {
  decodeAuthorization: JwtPayload;
  status:
    | 'CREATED'
    | 'PROCESSING'
    | 'RESOLVED_PAY_ALL'
    | 'RESOLVED_NOT_PAY'
    | 'RESOLVED_PAY_PART'
    | 'CANCEL'
    | 'NEED_MORE_PROOF';
}

export interface CancelDisputeRequest {
  decodeAuthorization: JwtPayload;
}

export interface DisputeListSearchRequest {
  status: 'CREATED' | 'PROCESSING' | 'RESOLVED' | 'CANCEL' | 'NEED_MORE_PROOF';
  project_name: string;
  freelancer_name: string;
  employer_name: string;
  solver_id: string;
}
