const Competition = require('../models/Competition');
const User = require('../models/User');
const Token = require('../models/Token');

// ── GET CURRENT COMPETITION ──
const getCurrentCompetition = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const type = user.plan === 'pro' ? 'pro' : 'free';

    const now = new Date();
    let competition = await Competition.findOne({
      type,
      status: { $in: ['active', 'upcoming'] },
      weekEnd: { $gte: now },
    }).sort({ weekStart: 1 });

    // Create new competition if none exists
    if (!competition) {
      competition = await createWeeklyCompetition(type);
    }

    // Check if user is a participant
    const isParticipant = competition.participants.some(
      p => p.userId.toString() === req.user.id
    );

    // Check if today is Monday and competition is active
    const dayOfWeek = now.getDay();
    const canJoin = dayOfWeek === 1 && competition.status === 'active';

    res.status(200).json({
      competition,
      isParticipant,
      canJoin,
      dayOfWeek,
    });
  } catch (error) {
    console.error('Get competition error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE WEEKLY COMPETITION ──
const createWeeklyCompetition = async (type) => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + daysUntilMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const status = daysUntilMonday === 0 ? 'active' : 'upcoming';

  return await Competition.create({
    weekStart,
    weekEnd,
    status,
    type,
    participants: [],
  });
};

// ── JOIN COMPETITION ──
const joinCompetition = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const type = user.plan === 'pro' ? 'pro' : 'free';

    const now = new Date();
    const dayOfWeek = now.getDay();

    // Only allow joining on Monday
    if (dayOfWeek !== 1) {
      return res.status(400).json({
        message: 'You can only join a competition on Monday. Wait for next week!',
        code: 'NOT_MONDAY',
      });
    }

    const competition = await Competition.findOne({
      type,
      status: 'active',
    });

    if (!competition) {
      return res.status(404).json({
        message: 'No active competition found.',
      });
    }

    const alreadyJoined = competition.participants.some(
      p => p.userId.toString() === req.user.id
    );
    if (alreadyJoined) {
      return res.status(400).json({
        message: 'You already joined this competition.',
      });
    }

    competition.participants.push({
      userId: req.user.id,
      fullName: user.fullName,
      university: user.university,
      points: 0,
      quizzesPlayed: 0,
      avgScore: 0,
      hasPlayedToday: false,
      daysPlayed: 0,
    });

    await competition.save();

    // Link competition to user
    await User.findByIdAndUpdate(req.user.id, {
      currentCompetitionId: competition._id,
      weeklyPoints: 0,
    });

    res.status(200).json({
      message: 'You joined the competition! Play quizzes daily to earn points.',
      competition,
    });
  } catch (error) {
    console.error('Join competition error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── UPDATE COMPETITION SCORE ──
const updateScore = async (competitionId, userId, score, percentage) => {
  try {
    const competition = await Competition.findById(competitionId);
    if (!competition) return;

    const participantIndex = competition.participants.findIndex(
      p => p.userId.toString() === userId
    );
    if (participantIndex === -1) return;

    const participant = competition.participants[participantIndex];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastPlayed = participant.lastPlayed
      ? new Date(participant.lastPlayed)
      : null;
    if (lastPlayed) lastPlayed.setHours(0, 0, 0, 0);

    const isNewDay = !lastPlayed || lastPlayed.getTime() !== today.getTime();

    if (isNewDay) {
      participant.daysPlayed += 1;
      participant.hasPlayedToday = true;
    }

    participant.points += score;
    participant.quizzesPlayed += 1;
    participant.lastPlayed = new Date();

    const totalScore = participant.points;
    participant.avgScore = Math.round(
      totalScore / participant.quizzesPlayed
    );

    competition.participants[participantIndex] = participant;
    await competition.save();

    // Update user weekly points
    await User.findByIdAndUpdate(userId, {
      $inc: { weeklyPoints: score },
    });
  } catch (error) {
    console.error('Update competition score error:', error.message);
  }
};

// ── GET LEADERBOARD ──
const getLeaderboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const type = user.plan === 'pro' ? 'pro' : 'free';

    const competition = await Competition.findOne({
      type,
      status: { $in: ['active', 'completed'] },
    }).sort({ weekStart: -1 });

    if (!competition) {
      return res.status(200).json({ leaderboard: [], competition: null });
    }

    const sorted = [...competition.participants].sort(
      (a, b) => b.points - a.points
    );

    res.status(200).json({
      leaderboard: sorted,
      competition,
      userRank: sorted.findIndex(
        p => p.userId.toString() === req.user.id
      ) + 1,
    });
  } catch (error) {
    console.error('Leaderboard error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── PROCESS WEEKLY REWARDS ──
const processRewards = async (req, res) => {
  try {
    const now = new Date();
    const completedCompetitions = await Competition.find({
      status: 'active',
      weekEnd: { $lte: now },
    });

    for (const competition of completedCompetitions) {
      competition.status = 'completed';

      const sorted = [...competition.participants].sort(
        (a, b) => b.points - a.points
      );

      // Reward top 3 for free plan
      if (competition.type === 'free') {
        const rewards = [
          { rank: 1, tokens: 10, uploads: 5, quizzes: 5 },
          { rank: 2, tokens: 5, uploads: 3, quizzes: 3 },
          { rank: 3, tokens: 3, uploads: 1, quizzes: 1 },
        ];

        for (let i = 0; i < Math.min(3, sorted.length); i++) {
          const winner = sorted[i];
          const reward = rewards[i];

          await User.findByIdAndUpdate(winner.userId, {
            $inc: {
              tokenBalance: reward.tokens,
              extraUploads: reward.uploads,
              extraQuizzes: reward.quizzes,
            },
          });

          // Record token transaction
          await Token.findOneAndUpdate(
            { userId: winner.userId },
            {
              $push: {
                transactions: {
                  type: 'earned',
                  amount: reward.tokens,
                  reason: `Weekly competition rank #${reward.rank}`,
                  date: new Date(),
                },
              },
              $inc: { balance: reward.tokens },
            },
            { upsert: true }
          );

          competition.winners.push({
            rank: reward.rank,
            userId: winner.userId,
            fullName: winner.fullName,
            points: winner.points,
            reward: `${reward.tokens} tokens + ${reward.uploads} extra uploads + ${reward.quizzes} extra quizzes`,
            rewardType: 'tokens',
          });
        }
      }

      // Reward top 1 for pro plan (10% discount)
      if (competition.type === 'pro' && sorted.length > 0) {
        const winner = sorted[0];

        await User.findByIdAndUpdate(winner.userId, {
          discount: 10,
        });

        competition.winners.push({
          rank: 1,
          userId: winner.userId,
          fullName: winner.fullName,
          points: winner.points,
          reward: '10% discount on next subscription',
          rewardType: 'discount',
        });
      }

      await competition.save();

      // Create next week competition
      await createNextWeekCompetition(competition.type);
    }

    res.status(200).json({ message: 'Rewards processed successfully' });
  } catch (error) {
    console.error('Process rewards error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── CREATE NEXT WEEK COMPETITION ──
const createNextWeekCompetition = async (type) => {
  try {
    const now = new Date();
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    nextSunday.setHours(23, 59, 59, 999);

    await Competition.create({
      weekStart: nextMonday,
      weekEnd: nextSunday,
      status: 'upcoming',
      type,
      participants: [],
    });

    console.log(`Created next week ${type} competition starting ${nextMonday}`);
  } catch (error) {
    console.error('Create next week error:', error.message);
  }
};

// ── GET TOKEN BALANCE ──
const getTokenBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'tokenBalance extraUploads extraQuizzes weeklyPoints'
    );
    const tokenRecord = await Token.findOne({ userId: req.user.id });

    res.status(200).json({
      tokenBalance: user.tokenBalance || 0,
      extraUploads: user.extraUploads || 0,
      extraQuizzes: user.extraQuizzes || 0,
      weeklyPoints: user.weeklyPoints || 0,
      transactions: tokenRecord?.transactions || [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCurrentCompetition,
  joinCompetition,
  updateScore,
  getLeaderboard,
  processRewards,
  getTokenBalance,
};