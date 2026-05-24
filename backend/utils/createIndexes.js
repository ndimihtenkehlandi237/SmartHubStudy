const mongoose = require('mongoose');
require('dotenv').config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for indexing...');

    const db = mongoose.connection.db;

    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { sparse: true });
    await db.collection('users').createIndex({ university: 1 });

    // Notes indexes
    await db.collection('notes').createIndex({ userId: 1 });
    await db.collection('notes').createIndex({ userId: 1, subjectId: 1 });
    await db.collection('notes').createIndex({ userId: 1, createdAt: -1 });

    // Quizzes indexes
    await db.collection('quizzes').createIndex({ noteId: 1, userId: 1 });
    await db.collection('quizzes').createIndex({ userId: 1 });

    // Results indexes
    await db.collection('results').createIndex({ userId: 1, createdAt: -1 });
    await db.collection('results').createIndex({ userId: 1, quizId: 1 });

    // Subjects indexes
    await db.collection('subjects').createIndex({ userId: 1 });

    // Messages indexes
    await db.collection('messages').createIndex({ groupId: 1, createdAt: 1 });

    // Competitions indexes
    await db.collection('competitions').createIndex({ status: 1, type: 1 });
    await db.collection('competitions').createIndex({ weekEnd: 1 });

    console.log('✅ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    process.exit(1);
  }
};

createIndexes();