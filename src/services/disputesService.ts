import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import {
  ChangeStatusTaskRequest,
  CreateTaskRequest,
  GetAllTaskRequest,
  UpdateTaskRequest
} from '~/models/requests/TaskRequest';
import Task from '~/models/schemas/TaskSchema';
import { RoleType, TaskStatus } from '~/constants/enum';
import Dispute from '~/models/schemas/DisputeSchema';
import {
  CancelDisputeRequest,
  ChangeStatusDisputeRequest,
  CreateDisputeRequest,
  UpdateDisputeRequest
} from '~/models/requests/DisputeRequest';
import projectsService from './projectsServices';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';

class DisputeService {
  constructor() {}

  async createDispute(payload: CreateDisputeRequest) {
    const findProject = await db.projects.findOne({ _id: new ObjectId(payload.project_id) });
    if (!findProject) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy dự án'
      });
    }
    const dispute = new Dispute({
      project_id: new ObjectId(payload.project_id),
      employer_id: new ObjectId(payload.employer_id),
      freelancer_id: new ObjectId(payload.freelancer_id),
      reporter: new ObjectId(payload.decodeAuthorization.payload.userId)
    });
    const savedDispute = await db.disputes.insertOne(dispute);
    const memberProject = await db.memberProject.findOne({
      project_id: new ObjectId(payload.project_id),
      user_id: new ObjectId(payload.freelancer_id)
    });

    if (memberProject) {
      const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(memberProject);
      if (currentPhase) {
        const newMileStoneInfo = memberProject.milestone_info;
        newMileStoneInfo[indexCurrentPhase] = {
          ...currentPhase,
          status: 'DISPUTED',
          dispute_id: savedDispute.insertedId
        };

        await db.memberProject.findOneAndUpdate(
          { project_id: new ObjectId(payload.project_id), user_id: new ObjectId(payload.freelancer_id) },
          {
            $set: { milestone_info: newMileStoneInfo }
          }
        );
      }
    }

    return savedDispute;
  }

  async updateDispute(id: string, payload: UpdateDisputeRequest) {
    const findDispute = await db.disputes.findOne({ _id: new ObjectId(id) });
    if (!findDispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const set_proof: any = {};
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    if (user_id.equals(findDispute.freelancer_id)) {
      set_proof.freelancer_proof = payload.proof;
    } else {
      set_proof.employer_proof = payload.proof;
    }
    const result = await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...set_proof
        }
      },
      { returnDocument: 'after' }
    );
    return result;
  }

  async changeStatusDispute(payload: ChangeStatusDisputeRequest) {
    const { _id, status } = payload;
    const findDispute = await db.disputes.findOne({ _id: new ObjectId(_id) });
    if (!findDispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const result = await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    return result;
  }

  async cancelDispute(payload: CancelDisputeRequest) {
    const { _id } = payload;
    const findDispute = await db.disputes.findOne({ _id: new ObjectId(_id) });
    if (!findDispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    if (findDispute.reporter.equals(payload.decodeAuthorization.payload.userId)) {
      const result = await db.disputes.findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: { status: 'CANCEL' } },
        { returnDocument: 'after' }
      );
      return result;
    }
    throw new ErrorWithStatus({
      status: httpStatus.FORBIDDEN,
      message: 'Bạn không có quyền hủy tranh chấp này'
    });
  }

  async getDisputeById(id: string, user_id: ObjectId) {
    console.log(id, user_id);
    const disputes = await db.disputes
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: { from: 'Projects', localField: 'project_id', foreignField: '_id', as: 'project_info' }
        },

        {
          $lookup: { from: 'Users', localField: 'employer_id', foreignField: '_id', as: 'employer_info' }
        },
        {
          $lookup: {
            from: 'Users',
            localField: 'freelancer_id',
            foreignField: '_id',
            as: 'freelancer_info'
          }
        },
        {
          $unwind: '$project_info'
        },
        {
          $unwind: '$employer_info'
        },
        {
          $unwind: '$freelancer_info'
        },
        {
          $project: {
            employer_info: {
              password: 0,
              forgot_password_token: 0,
              amount: 0,
              verify_code: 0,
              verified_info: {
                img_front: 0,
                img_back: 0,
                vid_portrait: 0
              }
            },
            freelancer_info: {
              password: 0,
              forgot_password_token: 0,
              amount: 0,
              verify_code: 0,
              verified_info: {
                img_front: 0,
                img_back: 0,
                vid_portrait: 0
              }
            }
          }
        }
      ])
      .toArray();
    console.log(disputes);
    if (disputes.length === 0) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const dispute = disputes[0];
    const user = await db.users.findOne({ _id: new ObjectId(user_id) });
    if (user?.role === RoleType.Admin) {
      return dispute;
    }
    if (dispute.employer_id.equals(user_id)) {
      if (dispute.freelancer_proof.share_proof) {
        return dispute;
      } else {
        return {
          ...dispute,
          freelancer_proof: {
            ...dispute.freelancer_proof,
            files: undefined
          }
        };
      }
    }
    if (dispute.freelancer_id.equals(user_id)) {
      if (dispute.employer_proof.share_proof) {
        return dispute;
      } else {
        return {
          ...dispute,
          employer_proof: {
            ...dispute.employer_proof,
            files: undefined
          }
        };
      }
    }
    throw new ErrorWithStatus({
      status: httpStatus.FORBIDDEN,
      message: 'Bạn không có quyền xem tranh chấp này'
    });
  }
}

const disputeService = new DisputeService();
export default disputeService;
