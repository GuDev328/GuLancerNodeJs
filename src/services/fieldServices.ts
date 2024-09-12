import db from '~/services/databaseServices';

class FieldService {
  constructor() {}

  async getAllField() {
    const result = await db.fields.find().toArray();
    return result;
  }
}

const fieldService = new FieldService();
export default fieldService;
