import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';
import { BookmarkRequest, CreateProjectRequest, GetAllProjectRequest } from '~/models/requests/ProjectRequest';
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
          return new ObjectId(init.insertedId);
        } else {
          return fieldFind._id;
        }
      })
    );
    const techsFinds = await Promise.all(
      payload.technologys.map(async (tech) => {
        const techFind = await db.technologies.findOne<Technology>({ name: tech });
        if (!techFind) {
          const init = await db.technologies.insertOne(new Technology({ name: tech }));
          return new ObjectId(init.insertedId);
        } else {
          return new ObjectId(techFind._id);
        }
      })
    );
    const project = new Project({
      title: payload.title,
      status: StatusProject.NotReady,
      admin_id: user_id,
      max_member: 1,
      members_id: [],
      salary: payload.salary,
      salaryType: payload.salaryType,
      description: payload.description,
      technologys: techsFinds,
      fields: fieldsFinds
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

  async getAll(page: number, limit: number, payload: GetAllProjectRequest) {
    const regexKey = payload.key ? new RegExp(payload.key, 'i') : null;

    let fieldsId = payload.fields?.map((field) => new ObjectId(field)) || [];
    let techsId = payload.technologys?.map((tech) => new ObjectId(tech)) || [];

    if (fieldsId.length === 0 && regexKey) {
      const res = await db.fields.find({ name: regexKey }).toArray();
      fieldsId = res.map((field) => new ObjectId(field._id));
    }
    if (techsId.length === 0 && regexKey) {
      const res = await db.technologies.find({ name: regexKey }).toArray();
      techsId = res.map((tech) => new ObjectId(tech._id));
    }

    const commonQuery = [
      {
        $lookup: {
          from: 'Users',
          localField: 'admin_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $lookup: {
          from: 'Technologies',
          localField: 'technologys',
          foreignField: '_id',
          as: 'technologies_info'
        }
      },
      {
        $lookup: {
          from: 'Users',
          localField: 'members_id',
          foreignField: '_id',
          as: 'members_info'
        }
      },

      {
        $lookup: {
          from: 'Fields',
          localField: 'fields',
          foreignField: '_id',
          as: 'fields_info'
        }
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            //{ $sort: { salary: -1 } }, // Sắp xếp theo lương giảm dần
            { $skip: (page - 1) * limit },
            { $limit: limit }
          ]
        }
      },
      {
        $addFields: {
          metadata: {
            $arrayElemAt: ['$metadata', 0]
          }
        }
      },
      {
        $addFields: {
          total_page: {
            $ceil: { $divide: ['$metadata.total', limit] }
          },
          page: page
        }
      }
    ];

    const queryNoTechField = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { title: regexKey } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null,
                techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },
      ...commonQuery
    ];

    const queryHasTech = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { title: regexKey } : {},
                fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },

      ...commonQuery
    ];

    const queryHasField = [
      {
        $match: {
          $and: [
            {
              $or: [
                regexKey ? { title: regexKey } : {},

                techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null
              ].filter(Boolean)
            },
            {
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },
      ...commonQuery
    ];

    const queryHasTechField = [
      {
        $match: {
          $and: [
            {
              ...(regexKey ? { title: regexKey } : {}),
              ...(fieldsId?.length ? { fields: { $elemMatch: { $in: fieldsId } } } : null),
              ...(techsId?.length ? { technologys: { $elemMatch: { $in: techsId } } } : null),
              ...(payload.salaryType ? { salaryType: payload.salaryType } : {}),
              ...(payload.salaryFrom != null && payload.salaryTo != null
                ? { salary: { $gte: payload.salaryFrom, $lte: payload.salaryTo } }
                : payload.salaryFrom != null
                  ? { salary: { $gte: payload.salaryFrom } }
                  : payload.salaryTo != null
                    ? { salary: { $lte: payload.salaryTo } }
                    : {})
            }
          ]
        }
      },
      ...commonQuery
    ];

    const query =
      payload.fields?.length && payload.technologys?.length
        ? queryHasTechField
        : payload.fields?.length
          ? queryHasField
          : payload.technologys?.length
            ? queryHasTech
            : queryNoTechField;

    const result = await db.projects.aggregate(query).toArray();

    const response = {
      page: result[0]?.page || 1,
      total_page: result[0]?.total_page || 0,
      limit: limit,
      data: result[0]?.data || []
    };
    return response;
  }
}

const projectsService = new ProjectsService();
export default projectsService;
