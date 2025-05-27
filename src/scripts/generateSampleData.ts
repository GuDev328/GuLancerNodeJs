import { ObjectId } from 'mongodb';
import {
  AccountStatus,
  GenderEnum,
  GroupTypes,
  HistoryAmountTypeEnum,
  MemberStatus,
  RoleType,
  SalaryType,
  StatusProject,
  TaskStatus,
  TweetTypeEnum,
  VerifyStatus
} from '~/constants/enum';
import { DateVi } from '~/utils/date-vi';
import User from '~/models/schemas/UserSchema';
import Field from '~/models/schemas/FieldSchema';
import Project from '~/models/schemas/ProjectSchema';
import Evaluation from '~/models/schemas/EvaluationSchema';
import HistoryAmount from '~/models/schemas/HistoryAmountSchema';
import Technology from '~/models/schemas/TechnologySchema';
import { Report } from '~/models/schemas/ReportSchema';
import Group from '~/models/schemas/GroupSchema';
import Payment from '~/models/schemas/PaymentSchema';
import Follower from '~/models/schemas/FollowerSchema';
import Task from '~/models/schemas/TaskSchema';
import Bookmark from '~/models/schemas/BookmarkSchema';
import Tweet from '~/models/schemas/TweetSchema';
import Like from '~/models/schemas/LikeSchema';
import Member from '~/models/schemas/MemberSchema';

// Generate sample data for Users
const generateUsers = () => {
  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = new User({
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      date_of_birth: new Date(1990 + i, 0, 1),
      phone_number: `098765432${i}`,
      password: 'hashed_password',
      username: `username${i + 1}`,
      role: i % 2 === 0 ? RoleType.Freelancer : RoleType.Employer,
      gender: i % 2 === 0 ? GenderEnum.Male : GenderEnum.Female,
      status: AccountStatus.Active,
      verified_info: {
        status: VerifyStatus.Unverified,
        img_front: 'https://example.com/img_front.jpg',
        img_back: 'https://example.com/img_back.jpg',
        vid_portrait: 'https://example.com/vid_portrait.mp4'
      }
    });
    users.push(user);
  }
  return users;
};

// Generate sample data for Fields
const generateFields = () => {
  const fields = [];
  const fieldNames = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'DevOps',
    'AI/ML',
    'Blockchain',
    'Game Development',
    'Cybersecurity',
    'Cloud Computing'
  ];

  for (let i = 0; i < 10; i++) {
    const field = new Field({
      name: fieldNames[i]
    });
    fields.push(field);
  }
  return fields;
};

// Generate sample data for Technologies
const generateTechnologies = () => {
  const technologies = [];
  const techNames = [
    'JavaScript',
    'Python',
    'Java',
    'React',
    'Node.js',
    'Angular',
    'Vue.js',
    'Django',
    'Spring Boot',
    'Flutter'
  ];

  for (let i = 0; i < 10; i++) {
    const tech = new Technology({
      name: techNames[i]
    });
    technologies.push(tech);
  }
  return technologies;
};

// Generate sample data for Projects
const generateProjects = (users: User[], fields: Field[], technologies: Technology[]) => {
  const projects = [];
  for (let i = 0; i < 10; i++) {
    const project = new Project({
      title: `Project ${i + 1}`,
      admin_id: users[i]._id,
      salaryType: i % 2 === 0 ? SalaryType.Project : SalaryType.Hour,
      description: `Description for project ${i + 1}`,
      technologies: [technologies[i]._id],
      fields: [fields[i]._id],
      recruitmentInfo: {
        number_people: Math.floor(Math.random() * 5) + 1,
        salary: Math.floor(Math.random() * 1000) + 500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      status: StatusProject.NotReady
    });
    projects.push(project);
  }
  return projects;
};

// Generate sample data for Groups
const generateGroups = (users: User[]) => {
  const groups = [];
  for (let i = 0; i < 10; i++) {
    const group = new Group({
      admin_id: [users[i]._id],
      name: `Group ${i + 1}`,
      type: i % 2 === 0 ? GroupTypes.Public : GroupTypes.Private,
      censor: true,
      description: `Description for group ${i + 1}`,
      cover_photo: 'https://example.com/cover.jpg'
    });
    groups.push(group);
  }
  return groups;
};

// Generate sample data for Tasks
const generateTasks = (users: User[], projects: Project[]) => {
  const tasks = [];
  for (let i = 0; i < 10; i++) {
    const task = new Task({
      project_id: projects[i]._id,
      title: `Task ${i + 1}`,
      description: `Description for task ${i + 1}`,
      status: TaskStatus.TODO,
      assign_to: users[i]._id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_by: users[i]._id
    });
    tasks.push(task);
  }
  return tasks;
};

// Generate sample data for Payments
const generatePayments = (users: User[]) => {
  const payments = [];
  for (let i = 0; i < 10; i++) {
    const payment = new Payment({
      user_id: users[i]._id,
      amount: Math.floor(Math.random() * 1000) + 100,
      paymentMethod: 'VNPAY',
      payment_url: 'https://example.com/payment',
      status: 'SUCCESS'
    });
    payments.push(payment);
  }
  return payments;
};

// Generate sample data for HistoryAmount
const generateHistoryAmounts = (users: User[]) => {
  const historyAmounts = [];
  for (let i = 0; i < 10; i++) {
    const historyAmount = new HistoryAmount({
      user_id: users[i]._id,
      amount: Math.floor(Math.random() * 1000) + 100,
      type: HistoryAmountTypeEnum.DEPOSIT
    });
    historyAmounts.push(historyAmount);
  }
  return historyAmounts;
};

// Generate sample data for Followers
const generateFollowers = (users: User[]) => {
  const followers = [];
  for (let i = 0; i < 10; i++) {
    const follower = new Follower({
      user_id: users[i]._id,
      followed_user_id: users[(i + 1) % 10]._id
    });
    followers.push(follower);
  }
  return followers;
};

// Generate sample data for Bookmarks
const generateBookmarks = (users: User[], projects: Project[]) => {
  const bookmarks = [];
  for (let i = 0; i < 10; i++) {
    const bookmark = new Bookmark({
      user_id: users[i]._id,
      project_id: projects[i]._id
    });
    bookmarks.push(bookmark);
  }
  return bookmarks;
};

// Generate sample data for Tweets
const generateTweets = (users: User[], groups: Group[]) => {
  const tweets = [];
  for (let i = 0; i < 10; i++) {
    const tweet = new Tweet({
      user_id: users[i]._id,
      group_id: groups[i]._id,
      type: TweetTypeEnum.Tweet,
      content: `Tweet content ${i + 1}`,
      parent_id: null,
      mentions: [],
      medias: [],
      censor: true,
      views: 0
    });
    tweets.push(tweet);
  }
  return tweets;
};

// Generate sample data for Likes
const generateLikes = (users: User[], tweets: Tweet[]) => {
  const likes = [];
  for (let i = 0; i < 10; i++) {
    const like = new Like({
      user_id: users[i]._id,
      tweet_id: tweets[i]._id
    });
    likes.push(like);
  }
  return likes;
};

// Generate sample data for Members
const generateMembers = (users: User[], groups: Group[]) => {
  const members = [];
  for (let i = 0; i < 10; i++) {
    const member = new Member({
      user_id: users[i]._id,
      group_id: groups[i]._id,
      status: MemberStatus.Accepted
    });
    members.push(member);
  }
  return members;
};

// Generate sample data for Evaluations
const generateEvaluations = (users: User[], projects: Project[]) => {
  const evaluations = [];
  for (let i = 0; i < 10; i++) {
    const evaluation = new Evaluation({
      user_id: users[i]._id,
      project_id: projects[i]._id,
      reviewer_id: users[(i + 1) % 10]._id,
      content: `Evaluation content ${i + 1}`,
      star: Math.floor(Math.random() * 5) + 1
    });
    evaluations.push(evaluation);
  }
  return evaluations;
};

// Generate sample data for Reports
const generateReports = (users: User[]) => {
  const reports = [];
  for (let i = 0; i < 10; i++) {
    const report = new Report({
      reporter: users[i]._id,
      id_reported: users[(i + 1) % 10]._id,
      type: 'POST',
      description: `Report description ${i + 1}`
    });
    reports.push(report);
  }
  return reports;
};

// Main function to generate all sample data
const generateAllSampleData = () => {
  const users = generateUsers();
  const fields = generateFields();
  const technologies = generateTechnologies();
  const projects = generateProjects(users, fields, technologies);
  const groups = generateGroups(users);
  const tasks = generateTasks(users, projects);
  const payments = generatePayments(users);
  const historyAmounts = generateHistoryAmounts(users);
  const followers = generateFollowers(users);
  const bookmarks = generateBookmarks(users, projects);
  const tweets = generateTweets(users, groups);
  const likes = generateLikes(users, tweets);
  const members = generateMembers(users, groups);
  const evaluations = generateEvaluations(users, projects);
  const reports = generateReports(users);

  return {
    users,
    fields,
    technologies,
    projects,
    groups,
    tasks,
    payments,
    historyAmounts,
    followers,
    bookmarks,
    tweets,
    likes,
    members,
    evaluations,
    reports
  };
};

export default generateAllSampleData;
