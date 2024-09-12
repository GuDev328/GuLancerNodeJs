import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { BookmarkRequest, CreateProjectRequest } from '~/models/requests/ProjectRequest';
import Bookmark from '~/models/schemas/BookmarkSchema';
import { httpStatus } from '~/constants/httpStatus';
import { ErrorWithStatus } from '~/models/Errors';
import Project from '~/models/schemas/ProjectSchema';
import { StatusProject } from '~/constants/enum';
import Field from '~/models/schemas/FieldSchema';
import Technology from '~/models/schemas/TechnologySchema';

class ProjectsService {
  constructor() {}

  async createProject(payload: CreateProjectRequest) {
    const user_id = new ObjectId(payload.decodeAuthorization.payload.userId);
    const fieldsFinds = await Promise.all(
      payload.fields.map(async (field) => {
        const fieldFind = await db.fields.findOne<Field>({ name: field });
        if (!fieldFind) {
          const init = await db.fields.insertOne(new Field({ name: field }));
          const initObj = await db.fields.findOne<Field>({ _id: init.insertedId });
          return initObj;
        } else {
          return fieldFind;
        }
      })
    );
    const techsFinds = await Promise.all(
      payload.technologys.map(async (tech) => {
        const techFind = await db.technologies.findOne<Technology>({ name: tech });
        if (!techFind) {
          const init = await db.technologies.insertOne(new Technology({ name: tech }));
          const initObj = await db.technologies.findOne<Technology>({ _id: init.insertedId });
          return initObj;
        } else {
          return techFind;
        }
      })
    );
    const project = new Project({
      title: payload.title,
      status: StatusProject.NotReady,
      admins_id: [user_id],
      max_member: 1,
      members_id: [],
      salary: payload.salary,
      salaryType: payload.salaryType,
      description: payload.description,
      technologys: techsFinds as Technology[],
      fields: fieldsFinds as Field[]
    });

    return await db.projects.insertOne(project);
  }

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
