import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { CreateGroupRequest, DecodeAuthorization } from '~/models/requests/GroupRequest';
import Group from '~/models/schemas/GroupSchema';
import Member from '~/models/schemas/MemberSchema';
import { GroupTypes, MemberStatus } from '~/constants/enum';

class GroupsService {
  constructor() {}
  async createGroup(payload: CreateGroupRequest) {
    const group = new Group({
      admin_id: [new ObjectId(payload.decodeAuthorization.payload.userId)],
      name: payload.name,
      type: payload.type,
      description: payload.description,
      cover_photo: payload.cover_photo
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
