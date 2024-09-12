import db from '~/services/databaseServices';
import { ObjectId } from 'mongodb';

class TechnologyService {
  constructor() {}

  async getAllTech() {
    const result = await db.technologies.find().toArray();
    return result;
  }
}

const technologyService = new TechnologyService();
export default technologyService;
