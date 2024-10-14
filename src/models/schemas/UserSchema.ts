import { ObjectId } from 'mongodb';
import { RoleType } from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';

interface UserType {
  _id?: ObjectId;
  name: string;
  email: string;
  date_of_birth: Date;
  phone_number: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  forgot_password_token?: string;
  description?: string;
  bio?: string;
  location?: string;
  website?: string;
  username: string;
  avatar?: string;
  salary?: number;
  cover_photo?: string;
  role: RoleType;
  technologies?: ObjectId[];
  project_done?: number;
  star?: number;
  verified?: boolean;
  fields?: ObjectId[];
}

export default class User {
  _id: ObjectId;
  name: string;
  email: string;
  date_of_birth: Date;
  phone_number: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  forgot_password_token: string;
  description: string;
  bio: string;
  location: string;
  website: string;
  username: string;
  avatar: string;
  cover_photo: string;
  salary: number;
  role: RoleType;
  technologies: ObjectId[];
  project_done: number;
  star: number;
  verified: boolean;
  fields: ObjectId[];
  constructor(user: UserType) {
    this._id = user._id || new ObjectId();
    this.name = user.name || '';
    this.email = user.email || '';
    this.date_of_birth = user.date_of_birth || DateVi();
    this.phone_number = user.phone_number || '';
    this.password = user.password || '';
    this.created_at = DateVi();
    this.updated_at = DateVi();
    this.salary = user.salary || 0;
    this.forgot_password_token = user.forgot_password_token || '';
    this.description = user.description || '';
    this.bio = user.bio || '';
    this.location = user.location || '';
    this.website = user.website || '';
    this.username = user.username || '';
    this.avatar = user.avatar || '';
    this.cover_photo = user.cover_photo || '';
    this.role = user.role || RoleType.Freelancer;
    this.technologies = user.technologies || [];
    this.project_done = 0;
    this.star = 0;
    this.verified = user.verified || false;
    this.fields = user.fields || [];
  }
}
