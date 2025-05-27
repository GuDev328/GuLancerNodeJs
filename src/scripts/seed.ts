import { ObjectId } from 'mongodb';
import db from '~/services/databaseServices';
import generateAllSampleData from './generateSampleData';

const seed = async () => {
  try {
    // Connect to database first
    await db.connect();

    // Generate sample data
    const {
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
    } = generateAllSampleData();

    // Insert data into collections
    await db.users.insertMany(users);
    await db.fields.insertMany(fields);
    await db.technologies.insertMany(technologies);
    await db.projects.insertMany(projects);
    await db.groups.insertMany(groups);
    await db.tasks.insertMany(tasks);
    await db.payments.insertMany(payments);
    await db.historyAmounts.insertMany(historyAmounts);
    await db.followers.insertMany(followers);
    await db.bookmarks.insertMany(bookmarks);
    await db.tweets.insertMany(tweets);
    await db.likes.insertMany(likes);
    await db.members.insertMany(members);
    await db.evaluations.insertMany(evaluations);
    await db.reports.insertMany(reports);

    console.log('Sample data has been seeded successfully!');
  } catch (error) {
    console.error('Error seeding sample data:', error);
  }
};

// Run the seed function
seed();
