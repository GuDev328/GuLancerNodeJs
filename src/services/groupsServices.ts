import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import { CreateGroupRequest } from '~/models/requests/GroupRequest';
import Group from '~/models/schemas/GroupSchema';
import Member from '~/models/schemas/MemberSchema';
import { MemberStatus } from '~/constants/enum';

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
}

const groupsService = new GroupsService();
export default groupsService;
