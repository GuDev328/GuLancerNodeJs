export enum TokenType {
  AccessToken,
  RefreshToken,
  FogotPasswordToken
}

export enum GenderEnum {
  Female,
  Male
}

export interface Media {
  url: string;
  type: MediaType;
}
export enum MediaType {
  Image,
  Video,
  VideoHLS
}

export enum VerifyStatus {
  Unverified,
  Pending,
  Approved,
  Rejected
}

export enum AccountSortBy {
  None,
  Star,
  ProjectDone
}

export enum TweetTypeEnum {
  Tweet,
  Retweet,
  Comment
}

export enum SendEmail {
  Password,
  FogotPassword
}

export enum RoleType {
  Freelancer,
  Employer,
  Undefined,
  Admin
}

export enum AccountStatus {
  Active,
  DisActive,
  Blocked
}

export enum RoleMemberProject {
  Member,
  Leader,
  Co_Admin
}

export enum StatusProject {
  NotReady,
  Recruiting,
  Processing,
  Pause,
  Paying,
  Complete
}

export enum TypeProject {
  Project,
  PerHour
}

export enum IssuesStatus {
  Processing,
  Processed
}

export enum TaskStatus {
  TODO,
  INPROCESSED,
  DONE,
  CANCEL
}

export enum GroupTypes {
  Public,
  Private
}

export enum MemberStatus {
  Waiting,
  Accepted,
  Rejected,
  Blocked
}

export enum InvitationType {
  Apply,
  Invitation
}

export enum SalaryType {
  Project,
  Hour
}

export enum ProjectOrderBy {
  CreatedAt,
  Salary,
  StarEmployer,
  ProjectDoneEmployer
}

export enum Order {
  Desc,
  Asc
}
