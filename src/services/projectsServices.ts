import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { BookmarkRequest } from '~/models/requests/ProjectRequest';
import Bookmark from '~/models/schemas/BookmarkSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';

class ProjectsService {
  constructor() {}

  async bookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    if (checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark đã được thêm',
        status: httpStatus.BAD_REQUEST
      });
    }
    const bookmark = new Bookmark({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    const createBookmark = await db.bookmarks.insertOne(bookmark);
    return createBookmark.insertedId;
  }

  async unbookmark(payload: BookmarkRequest) {
    const checkInDb = await db.bookmarks.findOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    if (!checkInDb) {
      throw new ErrorWithStatus({
        message: 'Bookmark không tồn tại',
        status: httpStatus.BAD_REQUEST
      });
    }
    const result = await db.bookmarks.deleteOne({
      user_id: payload.decodeAuthorization.payload.userId,
      project_id: new ObjectId(payload.project_id)
    });
    return result.deletedCount;
  }
}

const projectsService = new ProjectsService();
export default projectsService;
