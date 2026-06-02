const cron = require('node-cron');
const Competition = require('../models/Competition');
const User = require('../models/User');
const Token = require('../models/Token');

const processWeeklyRewards = async () => {
  try {
    console.log('🏆 Processing weekly competition rewards...');

    const now = new Date();

    // Find all active competitions that have ended
    const completedCompetitions = await Competition.find({
      status: 'active',
      weekEnd: { $lte: now },
    });

    if (completedCompetitions.length === 0) {
      console.log('No competitions to process this week.');
      return;
    }

    for (const competition of completedCompetitions) {
      competition.status = 'completed';

      const sorted = [...competition.participants].sort(
        (a, b) => b.points - a.points
      );

      // ── FREE PLAN REWARDS: Top 3 ──
      if (competition.type === 'free') {
        const rewards = [
          { rank: 1, tokens: 10, uploads: 5, quizzes: 5, label: '1st place' },
          { rank: 2, tokens: 5, uploads: 3, quizzes: 3, label: '2nd place' },
          { rank: 3, tokens: 3, uploads: 1, quizzes: 1, label: '3rd place' },
        ];

        for (let i = 0; i < Math.min(3, sorted.length); i++) {
          const winner = sorted[i];
          const reward = rewards[i];

          await User.findByIdAndUpdate(winner.userId, {
            $inc: {
              tokenBalance: reward.tokens,
              extraUploads: reward.uploads,
              extraQuizzes: reward.quizzes,
              points: reward.tokens * 10,
            },
          });

          await Token.findOneAndUpdate(
            { userId: winner.userId },
            {
              $push: {
                transactions: {
                  type: 'earned',
                  amount: reward.tokens,
                  reason: `Weekly competition ${reward.label} — ${reward.tokens} tokens + ${reward.uploads} uploads + ${reward.quizzes} quizzes`,
                  date: new Date(),
                },
              },
              $inc: { balance: reward.tokens },
            },
            { upsert: true, new: true }
          );

          competition.winners.push({
            rank: reward.rank,
            userId: winner.userId,
            fullName: winner.fullName,
            points: winner.points,
            reward: `${reward.tokens} tokens + ${reward.uploads} extra uploads + ${reward.quizzes} extra quizzes`,
            rewardType: 'tokens',
          });

          console.log(`✅ Rewarded ${winner.fullName} (rank ${reward.rank}): ${reward.tokens} tokens`);
        }
      }

      // ── PRO PLAN REWARDS: Top 1 ──
      if (competition.type === 'pro' && sorted.length > 0) {
        const winner = sorted[0];

        await User.findByIdAndUpdate(winner.userId, {
          discount: 10,
          $inc: { points: 500 },
        });

        competition.winners.push({
          rank: 1,
          userId: winner.userId,
          fullName: winner.fullName,
          points: winner.points,
          reward: '10% discount on next Pro subscription',
          rewardType: 'discount',
        });

        console.log(`✅ Rewarded ${winner.fullName} (Pro winner): 10% discount`);
      }

      await competition.save();

      // ── CREATE NEXT WEEK COMPETITION ──
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextMonday.getDate() + 6);
      nextSunday.setHours(23, 59, 59, 999);

      const existingNext = await Competition.findOne({
        type: competition.type,
        status: 'upcoming',
        weekStart: nextMonday,
      });

      if (!existingNext) {
        await Competition.create({
          weekStart: nextMonday,
          weekEnd: nextSunday,
          status: 'upcoming',
          type: competition.type,
          participants: [],
        });
        console.log(`📅 Created next week ${competition.type} competition`);
      }

      // ── ACTIVATE UPCOMING COMPETITIONS ON MONDAY ──
      await Competition.updateMany(
        {
          status: 'upcoming',
          weekStart: { $lte: now },
        },
        { status: 'active' }
      );
    }

    console.log('✅ Weekly rewards processing complete!');
  } catch (error) {
    console.error('❌ Cron job error:', error.message);
  }
};

const startCronJobs = () => {
  // Run every Sunday at 11:59 PM to process rewards
  cron.schedule('59 23 * * 0', () => {
    console.log('⏰ Sunday midnight — processing competition rewards...');
    processWeeklyRewards();
  }, {
    timezone: 'Africa/Douala',
  });

  // Run every Monday at 12:01 AM to activate upcoming competitions
  cron.schedule('1 0 * * 1', async () => {
    console.log('⏰ Monday — activating new competitions...');
    try {
      const now = new Date();
      await Competition.updateMany(
        { status: 'upcoming', weekStart: { $lte: now } },
        { status: 'active' }
      );
      console.log('✅ Competitions activated for the week!');
    } catch (error) {
      console.error('❌ Monday activation error:', error.message);
    }
  }, {
    timezone: 'Africa/Douala',
  });

  // Reset hasPlayedToday for all participants every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Daily reset — clearing hasPlayedToday flags...');
    try {
      await Competition.updateMany(
        { status: 'active' },
        { $set: { 'participants.$[].hasPlayedToday': false } }
      );
      console.log('✅ Daily reset complete!');
    } catch (error) {
      console.error('❌ Daily reset error:', error.message);
    }
  }, {
    timezone: 'Africa/Douala',
  });

  console.log('✅ Cron jobs started — competition rewards on auto-pilot!');
};

module.exports = { startCronJobs, processWeeklyRewards };