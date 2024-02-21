import { faker } from '@faker-js/faker';
import { ObjectId } from 'mongodb';
import { TweetAudience, TweetTypeEnum, UserVerifyStatus } from '~/constants/enum';
import { TweetRequest } from '~/models/requests/TweetRequest';
import { RegisterRequest } from '~/models/requests/UserRequests';
import User from '~/models/schemas/UserSchema';
import db from '~/services/databaseServices';
import bcrypt from 'bcrypt';
import Follower from '~/models/schemas/FollowerSchema';
import tweetsService from '~/services/tweetsServices';

const PASSWORD = '12345678';
const MYID = new ObjectId('65b12c6d3742e26204688ef1');
const USER_COUNT = 100;

const createRandomUser = () => {
  const user: RegisterRequest = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirmPassword: PASSWORD,
    username: faker.internet.userName(),
    date_of_birth: faker.date.past().toISOString()
  };
  return user;
};

const createRandomTweets = () => {
  const tweet: TweetRequest = {
    type: TweetTypeEnum.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({ min: 10, max: 100 }),
    parent_id: null,
    hashtags: faker.lorem.words(5).split(' '),
    mentions: [],
    medias: [],
    decodeAuthorization: {
      payload: {
        userId: new ObjectId()
      }
    }
  };
  return tweet;
};

const users: RegisterRequest[] = faker.helpers.multiple(createRandomUser, { count: USER_COUNT });

const insertUsers = async (users: RegisterRequest[]) => {
  const result = await Promise.all(
    users.map(async (user) => {
      const userId = new ObjectId();
      const saltRounds = 10;
      user.password = await bcrypt.hashSync(user.password, saltRounds);
      await db.users.insertOne(
        new User({
          ...user,
          _id: userId,
          username: 'user' + userId.toString(),
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified
        })
      );
      return userId;
    })
  );
  return result;
};

const followUsers = async (user_id: ObjectId, followed_user_id: ObjectId[]) => {
  console.log('start followUsers');
  await Promise.all(
    followed_user_id.map(async (followed_user) => {
      await db.followers.insertOne(
        new Follower({
          user_id: user_id,
          followed_user_id: new ObjectId(followed_user)
        })
      );
    })
  );
  console.log('end followUsers');
};

const insertTweets = async (ids: ObjectId[]) => {
  console.log('start insertTweets');
  let count: number = 0;
  const result = await Promise.all(
    ids.map(async (id) => {
      const tweet = createRandomTweets();
      tweet.decodeAuthorization.payload.userId = id;
      await Promise.all([tweetsService.createNewTweet(tweet)]);
      count += 2;
      console.log('count: ', count);
    })
  );
  return result;
};

insertUsers(users).then(async (ids) => {
  followUsers(new ObjectId(MYID), ids);
  insertTweets(ids);
});
