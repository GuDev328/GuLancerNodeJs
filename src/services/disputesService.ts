import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import {
  ChangeStatusTaskRequest,
  CreateTaskRequest,
  GetAllTaskRequest,
  UpdateTaskRequest
} from '~/models/requests/TaskRequest';
import Task from '~/models/schemas/TaskSchema';
import { HistoryAmountTypeEnum, RoleType, StatusProject, TaskStatus } from '~/constants/enum';
import Dispute from '~/models/schemas/DisputeSchema';
import {
  CancelDisputeRequest,
  ChangeStatusDisputeRequest,
  CreateDisputeRequest,
  DisputeListSearchRequest,
  UpdateDisputeRequest
} from '~/models/requests/DisputeRequest';
import projectsService from './projectsServices';
import { ErrorWithStatus } from '~/models/Errors';
import { httpStatus } from '~/constants/httpStatus';
import { JwtPayload } from 'jsonwebtoken';
import HistoryAmount from '~/models/schemas/HistoryAmountSchema';
import { DateVi } from '~/utils/date-vi';
import { lookupUser } from '~/utils/lookup';

class DisputeService {
  constructor() {}

  checkRole(decodeAuthorization: JwtPayload, dispute: Dispute) {
    const user_id = new ObjectId(decodeAuthorization.payload.userId);
    if (
      user_id.equals(dispute.employer_id) ||
      user_id.equals(dispute.freelancer_id) ||
      decodeAuthorization.payload.role === RoleType.Admin
    ) {
      return true;
    } else return false;
  }

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
      employer_id: new ObjectId(findProject.admin_id),
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
    if (!this.checkRole(payload.decodeAuthorization, findDispute)) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Bạn không có quyền cập nhật tranh chấp này'
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

  async changeStatusDispute(_id: string, payload: ChangeStatusDisputeRequest) {
    const { status } = payload;
    const findDispute = await db.disputes.findOne({ _id: new ObjectId(_id) });
    if (!findDispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    if (
      !(
        findDispute.reporter.equals(payload.decodeAuthorization.payload.userId) ||
        payload.decodeAuthorization.payload.role === RoleType.Admin
      )
    ) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Bạn không có quyền cập nhật tranh chấp này'
      });
    }
    const result = await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(_id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );
    return result;
  }

  async cancelDispute(id: string, payload: CancelDisputeRequest) {
    const findDispute = await db.disputes.findOne({ _id: new ObjectId(id) });
    if (!findDispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    if (findDispute.reporter.equals(payload.decodeAuthorization.payload.userId)) {
      const result = await db.disputes.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: 'CANCEL' } },
        { returnDocument: 'after' }
      );
      const memberProject = await db.memberProject.findOne({
        project_id: findDispute.project_id,
        user_id: findDispute.freelancer_id
      });

      if (memberProject) {
        const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(memberProject);
        if (currentPhase) {
          const newMileStoneInfo = memberProject.milestone_info;
          newMileStoneInfo[indexCurrentPhase] = {
            ...currentPhase,
            status: 'PAYING'
          };

          await db.memberProject.findOneAndUpdate(
            { project_id: findDispute.project_id, user_id: findDispute.freelancer_id },
            {
              $set: { milestone_info: newMileStoneInfo }
            }
          );
        }
      }

      return result;
    }

    throw new ErrorWithStatus({
      status: httpStatus.FORBIDDEN,
      message: 'Bạn không có quyền hủy tranh chấp này'
    });
  }

  async getDisputeById(id: string, user_id: ObjectId, decodeAuthorization: JwtPayload) {
    const disputes = await db.disputes
      .aggregate([
        {
          $match: { _id: new ObjectId(id) }
        },
        {
          $lookup: { from: 'Projects', localField: 'project_id', foreignField: '_id', as: 'project_info' }
        },
        ...lookupUser('employer_id', 'employer_info'),
        ...lookupUser('freelancer_id', 'freelancer_info'),
        {
          $unwind: '$project_info'
        }
      ])
      .toArray();
    if (disputes.length === 0) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const dispute = disputes[0];
    if (!this.checkRole(decodeAuthorization, dispute as Dispute)) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Bạn không có quyền xem tranh chấp này'
      });
    }

    const memberProject = await db.memberProject.findOne({
      project_id: dispute.project_id,
      user_id: dispute.freelancer_id
    });
    let milestone_info: any = memberProject?.milestone_info.find((milestone) =>
      milestone.dispute_id?.equals(dispute._id)
    );
    milestone_info = {
      ...milestone_info,
      countMilestone: milestone_info?.no + '/' + memberProject?.milestone_info.length
    };

    const user = await db.users.findOne({ _id: new ObjectId(user_id) });
    if (user?.role === RoleType.Admin) {
      return {
        ...dispute,
        milestone_info
      };
    }

    if (decodeAuthorization.payload.role === RoleType.Admin) {
      return {
        ...dispute,
        milestone_info
      };
    }

    if (dispute.employer_id.equals(user_id)) {
      if (dispute.freelancer_proof.share_proof) {
        return dispute;
      } else {
        return {
          ...dispute,
          milestone_info,
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
          milestone_info,
          employer_proof: {
            ...dispute.employer_proof,
            files: undefined
          }
        };
      }
    }
  }

  async getListDispute(page: number, limit: number, payload: DisputeListSearchRequest) {
    const { status, project_name, freelancer_name, employer_name, solver_id } = payload;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'Projects',
          localField: 'project_id',
          foreignField: '_id',
          as: 'project_info'
        }
      },
      ...lookupUser('freelancer_id', 'freelancer_info'),
      ...lookupUser('employer_id', 'employer_info'),
      {
        $unwind: {
          path: '$project_info',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    const matchStage: any = {};

    if (status) {
      matchStage.status = status;
    }

    if (project_name) {
      matchStage['project_info.title'] = { $regex: project_name, $options: 'i' };
    }

    if (freelancer_name) {
      matchStage['freelancer_info.name'] = { $regex: freelancer_name, $options: 'i' };
      matchStage['freelancer_info.username'] = { $regex: freelancer_name, $options: 'i' };
    }

    if (employer_name) {
      matchStage['employer_info.name'] = { $regex: employer_name, $options: 'i' };
      matchStage['employer_info.username'] = { $regex: employer_name, $options: 'i' };
    }

    if (solver_id) {
      matchStage.solver_id = new ObjectId(solver_id);
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    const disputes = await db.disputes.aggregate(pipeline).toArray();
    const total_record = await db.disputes.aggregate([...pipeline.slice(0, -2)]).toArray();
    return {
      page,
      limit,
      disputes,
      total_page: Math.ceil(total_record.length / limit),
      total_record: total_record.length
    };
  }

  async payAllDispute(id: string, payload: { description: string }) {
    const dispute = await db.disputes.findOne({ _id: new ObjectId(id) });
    if (!dispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const result = await projectsService.payForMember(dispute.project_id, dispute.freelancer_id, dispute.employer_id);
    await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'RESOLVED_PAY_ALL', reason_resolve: payload.description } },
      { returnDocument: 'after' }
    );
    return result;
  }

  async payOneDispute(id: string, payload: { description: string; amount: number }) {
    const dispute = await db.disputes.findOne({ _id: new ObjectId(id) });
    if (!dispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }

    const memberProject = await db.memberProject.findOne({
      project_id: dispute.project_id,
      user_id: dispute.freelancer_id
    });

    if (!memberProject)
      throw new ErrorWithStatus({ message: 'Không tìm thấy thành viên dự án', status: httpStatus.NOT_FOUND });

    const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(memberProject);
    const newEscrowing = memberProject.escrowed - Number(payload.amount);

    db.users.findOneAndUpdate(
      { _id: dispute.freelancer_id },
      {
        $inc: { amount: Number(payload.amount) }
      }
    );
    db.users.findOneAndUpdate(
      { _id: dispute.employer_id },
      {
        $inc: { amount: -1 * Number(payload.amount) }
      }
    );
    db.historyAmounts.insertOne(
      new HistoryAmount({
        user_id: dispute.freelancer_id,
        amount: Number(payload.amount),
        type: HistoryAmountTypeEnum.FROM_PROJECT
      })
    );
    db.historyAmounts.insertOne(
      new HistoryAmount({
        user_id: dispute.employer_id,
        amount: Number(payload.amount),
        type: HistoryAmountTypeEnum.TO_PROJECT
      })
    );

    const newMileStoneInfo = memberProject.milestone_info;
    newMileStoneInfo[indexCurrentPhase] = {
      ...currentPhase,
      salary_unpaid: currentPhase.salary_unpaid - Number(payload.amount),
      day_to_payment: DateVi(),
      status: 'PROCESSING'
    };

    await db.memberProject.findOneAndUpdate(
      { project_id: dispute.project_id, user_id: dispute.freelancer_id },
      {
        $set: { milestone_info: newMileStoneInfo, escrowed: newEscrowing }
      }
    );

    await db.projects.findOneAndUpdate({ _id: dispute.project_id }, { $set: { status: StatusProject.Processing } });

    const result = await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'RESOLVED_PAY_PART', reason_resolve: payload.description } },
      { returnDocument: 'after' }
    );
    return result;
  }

  async notPayDispute(id: string, payload: { description: string }) {
    const dispute = await db.disputes.findOne({ _id: new ObjectId(id) });
    if (!dispute) {
      throw new ErrorWithStatus({
        status: 400,
        message: 'Không tìm thấy tranh chấp này'
      });
    }
    const memberProject = await db.memberProject.findOne({
      project_id: dispute.project_id,
      user_id: dispute.freelancer_id
    });
    if (!memberProject)
      throw new ErrorWithStatus({ message: 'Không tìm thấy thành viên dự án', status: httpStatus.NOT_FOUND });
    const { currentPhase, indexCurrentPhase } = projectsService.getCurrentPhase(memberProject);
    const newMileStoneInfo = memberProject.milestone_info;
    newMileStoneInfo[indexCurrentPhase] = {
      ...currentPhase,
      status: 'PROCESSING'
    };

    await db.memberProject.findOneAndUpdate(
      { project_id: dispute.project_id, user_id: dispute.freelancer_id },
      {
        $set: { milestone_info: newMileStoneInfo }
      }
    );

    await db.projects.findOneAndUpdate({ _id: dispute.project_id }, { $set: { status: StatusProject.Processing } });

    const result = await db.disputes.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: 'RESOLVED_NOT_PAY', reason_resolve: payload.description } },
      { returnDocument: 'after' }
    );
    return result;
  }
}

const disputeService = new DisputeService();
export default disputeService;
