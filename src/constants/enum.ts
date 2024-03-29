export enum TokenType {
  AccessToken,
  RefreshToken,
  FogotPasswordToken
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
  Undefined
}

export enum StatusProject {
  NotReady,
  Recruiting,
  Processing,
  Pause,
  Complete
}

export enum IssuesStatus {
  Processing,
  Processed
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
