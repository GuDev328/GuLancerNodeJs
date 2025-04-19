import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { CreateGroupRequest, DecodeAuthorization, EditGroupRequest } from '~/models/requests/GroupRequest';
import Group from '~/models/schemas/GroupSchema';
import Member from '~/models/schemas/MemberSchema';
import { GroupTypes, MemberStatus } from '~/constants/enum';
import { lookupUser } from '~/utils/lookup';

class GroupsService {
  constructor() {}
  async createGroup(payload: CreateGroupRequest) {
    const group = new Group({
      admin_id: [new ObjectId(payload.decodeAuthorization.payload.userId)],
      name: payload.name,
      type: payload.type,
      description: payload.description,
      cover_photo: payload.cover_photo,
      censor: payload.type === GroupTypes.Private
    });

    const createGroup = await db.groups.insertOne(group);
    const member = new Member({
      user_id: new ObjectId(payload.decodeAuthorization.payload.userId),
      group_id: createGroup.insertedId,
      status: MemberStatus.Accepted
    });
    const createMember = await db.members.insertOne(member);
    return;
  }

  async editGroup(payload: EditGroupRequest) {
    const group = await db.groups.findOneAndUpdate(
      { _id: new ObjectId(payload.group_id) },
      {
        $set: {
          censor: payload.censor,
          cover_photo: payload.cover_photo,
          description: payload.description,
          name: payload.name,
          type: payload.type
        }
      }
    );
  }

  async getMembers(group_id: ObjectId, page: number, limit: number, status: MemberStatus) {
    const skip = (page - 1) * limit;
    const [result] = await db.members
      .aggregate([
        {
          $facet: {
            metadata: [{ $match: { group_id, status } }, { $count: 'total_records' }],
            data: [{ $match: { group_id } }, ...lookupUser('user_id'), { $skip: skip }, { $limit: limit }]
          }
        }
      ])
      .toArray();

    const total_records = result.metadata[0]?.total_records || 0;
    const total_pages = Math.ceil(total_records / limit);

    return {
      members: result.data,
      pagination: {
        total_records,
        total_pages,
        current_page: page,
        limit
      }
    };
  }

  async getMyGroups(payload: DecodeAuthorization) {
    const userId = payload.decodeAuthorization.payload.userId;
    const members = await db.members.find({ user_id: new ObjectId(userId) }).toArray();
    const groups = await Promise.all(
      members
        .filter((member) => member.status === MemberStatus.Accepted)
        .map(async (member) => {
          const group = await db.groups.findOne({ _id: member.group_id });

          if (!group) {
            throw new ErrorWithStatus({ message: 'Group not found', status: httpStatus.NOT_FOUND });
          }
          let gr;
          if (group.admin_id.some((id) => id.toString() === userId.toString())) {
            gr = { ...group, isAdmin: true };
          } else {
            gr = { ...group, isAdmin: false };
          }
          return gr;
        })
    );

    return groups;
  }

  async getGroupById(group_id: ObjectId, user_id: ObjectId) {
    const group = await db.groups.findOne({ _id: group_id });
    if (!group) {
      throw new ErrorWithStatus({ message: 'Group not found', status: httpStatus.NOT_FOUND });
    }
    return group;
  }

  async joinGroup(group_id: ObjectId, user_id: ObjectId) {
    const group = await db.groups.findOne({ _id: group_id });
    if (!group) {
      throw new ErrorWithStatus({ message: 'Group not found', status: httpStatus.NOT_FOUND });
    }
    let statusMember: MemberStatus = MemberStatus.Waiting;
    if (group.type === GroupTypes.Public) statusMember = MemberStatus.Accepted;
    if (group.type === GroupTypes.Private) statusMember = MemberStatus.Waiting;
    const member = new Member({
      group_id,
      user_id,
      status: statusMember
    });
    const createMember = await db.members.insertOne(member);
    return createMember;
  }
}

const groupsService = new GroupsService();
export default groupsService;
