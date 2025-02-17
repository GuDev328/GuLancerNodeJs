import { ObjectId } from 'mongodb';
import { AccountStatus, GenderEnum, RoleType, VerifyStatus } from '~/constants/enum';
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
  amount?: number;
  location?: string;
  username: string;
  avatar?: string;
  salary?: number;
  cover_photo?: string;
  role: RoleType;
  technologies?: ObjectId[];
  project_done?: number;
  star?: number;
  fields?: ObjectId[];
  gender?: GenderEnum;
  status?: AccountStatus;
  verified_info?: VerifyInfo;
}

interface VerifyInfo {
  status: VerifyStatus;
  img_front: string;
  img_back: string;
  vid_portrait: string;
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
  username: string;
  avatar: string;
  amount: number;
  cover_photo: string;
  salary: number;
  role: RoleType;
  technologies: ObjectId[];
  project_done: number;
  star: number;
  fields: ObjectId[];
  gender: GenderEnum;
  status: AccountStatus;
  verified_info: VerifyInfo;

  constructor(user: UserType) {
    this._id = user._id || new ObjectId();
    this.name = user.name || '';
    this.email = user.email || '';
    this.date_of_birth = user.date_of_birth || DateVi();
    this.phone_number = user.phone_number || '';
    this.password = user.password || '';
    this.created_at = DateVi();
    this.updated_at = DateVi();
    this.amount = 0;
    this.gender = user.gender || GenderEnum.Male;
    this.salary = user.salary || 0;
    this.forgot_password_token = user.forgot_password_token || '';
    this.description = user.description || '';
    this.bio = user.bio || '';
    this.location = user.location || '';
    this.username = user.username || '';
    this.avatar =
      user.avatar || user.gender === GenderEnum.Male
        ? 'https://gulancer.s3.ap-southeast-1.amazonaws.com/common/avtMale.png'
        : 'https://gulancer.s3.ap-southeast-1.amazonaws.com/common/avtFemale.png';
    this.cover_photo = user.cover_photo || 'https://gulancer.s3.ap-southeast-1.amazonaws.com/common/cover_photo.jpg';
    this.role = user.role || RoleType.Freelancer;
    this.technologies = user.technologies || [];
    this.project_done = 0;
    this.star = 5;
    this.fields = user.fields || [];
    this.status = user.status || AccountStatus.Active;
    this.verified_info = user.verified_info || {
      status: VerifyStatus.Unverified,
      img_front: '',
      img_back: '',
      vid_portrait: ''
    };
  }
}
