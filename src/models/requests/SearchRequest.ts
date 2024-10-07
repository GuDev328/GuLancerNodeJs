export enum FreelancerOrderBy {
  ProjectDone,
  Salary,
  Star
}

export const FreelancerOrderByO = {
  Salary: FreelancerOrderBy.Salary,
  Star: FreelancerOrderBy.Star,
  ProjectDone: FreelancerOrderBy.ProjectDone
};

export interface SearchFreelancerRequest {
  key?: string;
  fields?: string[];
  technologies?: string[];
  salaryFrom?: number;
  salaryTo?: number;
  orderBy?: FreelancerOrderBy;
}
