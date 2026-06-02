import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft, FaTrophy, FaSpinner,
  FaFire, FaStar, FaCoins, FaClock
} from 'react-icons/fa';
import { getToken, getUser } from '../services/authService';
import API from '../services/api';

const getRankIcon = rank => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const getRewardText = (rank, type) => {
  if (type === 'free') {
    if (rank === 1) return '10 tokens + 5 uploads + 5 quizzes';
    if (rank === 2) return '5 tokens + 3 uploads + 3 quizzes';
    if (rank === 3) return '3 tokens + 1 upload + 1 quiz';
  }
  if (type === 'pro' && rank === 1) return '10% discount on next subscription';
  return '';
};

function TokenCard({ tokens, t }) {
  return (
    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white">
      <h3 className="font-bold mb-3">{t('myRewards')}</h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
          <FaCoins className="text-2xl mx-auto mb-1" />
          <p className="text-2xl font-black">{tokens.tokenBalance}</p>
          <p className="text-xs opacity-80">{t('tokensLabel')}</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
          <FaStar className="text-2xl mx-auto mb-1" />
          <p className="text-2xl font-black">{tokens.extraUploads}</p>
          <p className="text-xs opacity-80">{t('extraUploadsLabel')}</p>
        </div>
        <div className="bg-white bg-opacity-20 rounded-xl p-3 text-center">
          <FaFire className="text-2xl mx-auto mb-1" />
          <p className="text-2xl font-black">{tokens.extraQuizzes}</p>
          <p className="text-xs opacity-80">{t('extraQuizzesLabel')}</p>
        </div>
      </div>
    </div>
  );
}

function CompetitionCard({ competition, isParticipant, dayOfWeek, isPro, onJoin, joining, t }) {
  const navigate = useNavigate();
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;

  if (!competition) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <FaTrophy className="text-5xl text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500">No competition available yet.</p>
        <p className="text-gray-400 text-sm mt-1">Check back on Monday!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`p-4 text-white ${
        competition.status === 'active'
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : competition.status === 'upcoming'
          ? 'bg-gradient-to-r from-blue-500 to-primary'
          : 'bg-gradient-to-r from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80 font-medium">
              {isPro ? t('proCompetition') : t('freeCompetition')}
            </p>
            <h2 className="text-xl font-black mt-0.5">
              {competition.status === 'active' ? t('competitionActive') :
               competition.status === 'upcoming' ? t('comingSoon') :
               t('completedStatus')}
            </h2>
            <p className="text-sm opacity-80 mt-1">
              {new Date(competition.weekStart).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short'
              })} →{' '}
              {new Date(competition.weekEnd).toLocaleDateString('en-GB', {
                weekday: 'short', day: 'numeric', month: 'short'
              })}
            </p>
          </div>
          <FaTrophy className="text-4xl opacity-60" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="font-bold text-blue-800 mb-2 text-sm">{t('howItWorks')}</h4>
          <ul className="text-xs text-blue-700 space-y-1.5">
            {[t('joinMondayRule'), t('playDailyRule'), t('rankUpdatesRule'), t('sundayRewardRule')].map((rule, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="font-bold flex-shrink-0">{i + 1}.</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-xl p-4">
          <h4 className="font-bold text-yellow-800 mb-2 text-sm">{t('weeklyRewards')}</h4>
          <div className="space-y-2">
            {[1, 2, 3].map(rank => {
              const reward = getRewardText(rank, isPro ? 'pro' : 'free');
              if (!reward) return null;
              if (isPro && rank > 1) return null;
              return (
                <div key={rank} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{getRankIcon(rank)}</span>
                  <span className="text-yellow-700 font-medium">{reward}</span>
                </div>
              );
            })}
          </div>
        </div>

        {competition.status === 'active' && !isParticipant && (
          <>
            {dayOfWeek === 1 ? (
              <button
                onClick={onJoin}
                disabled={joining}
                className="w-full bg-primary hover:bg-secondary text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2 text-lg"
              >
                {joining ? <FaSpinner className="animate-spin" /> : <FaTrophy />}
                {joining ? 'Joining...' : t('joinCompetitionBtn')}
              </button>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <FaClock className="text-gray-400 text-3xl mx-auto mb-2" />
                <p className="font-bold text-gray-600 text-sm">{t('competitionEntryClosed')}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {t('entryClosedMsg')}{' '}
                  {daysUntilMonday > 0 && `${t('nextMondayMsg')} ${daysUntilMonday} ${t('daysUntilMonday')}`}
                </p>
              </div>
            )}
          </>
        )}

        {competition.status === 'active' && isParticipant && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="font-bold text-green-700 text-sm">{t('youAreIn')}</p>
            <p className="text-green-500 text-xs mt-1">Play quizzes daily to climb the leaderboard!</p>
            <button
              onClick={() => navigate('/notes')}
              className="mt-3 bg-green-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-green-700 transition text-sm"
            >
              {t('playQuizNow')}
            </button>
          </div>
        )}

        {competition.status === 'upcoming' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <p className="font-bold text-blue-700 text-sm">{t('comingSoon')}</p>
            <p className="text-blue-500 text-xs mt-1">
              {daysUntilMonday === 0
                ? 'Today is Monday! Come back to join!'
                : `${daysUntilMonday} ${t('daysUntilMonday')}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ leaderboard, userId, competition, t }) {
  if (leaderboard.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg">{t('leaderboardTitle')}</h3>
        </div>
        <div className="p-8 text-center text-gray-400">
          <FaTrophy className="text-4xl mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t('noParticipants')}</p>
          <p className="text-xs mt-1">{t('beFirst')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 text-lg">{t('leaderboardTitle')}</h3>
        <p className="text-gray-400 text-xs mt-0.5">
          {competition?.participants?.length || 0} {t('participantsLabel')}
        </p>
      </div>
      <div className="divide-y divide-gray-100">
        {leaderboard.map((participant, i) => {
          const rank = i + 1;
          const isCurrentUser = participant.userId?.toString() === userId;
          return (
            <div
              key={i}
              className={`flex items-center gap-4 p-4 ${rank <= 3 ? 'bg-yellow-50' : ''} ${isCurrentUser ? 'bg-blue-50' : ''}`}
            >
              <div className="text-2xl w-10 text-center flex-shrink-0">
                {getRankIcon(rank)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${isCurrentUser ? 'text-primary' : 'text-gray-800'}`}>
                  {participant.fullName}{isCurrentUser && ' (You)'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {participant.university} • {participant.quizzesPlayed} quizzes • {participant.daysPlayed} days
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-black text-primary text-lg">{participant.points}</p>
                <p className="text-xs text-gray-400">{t('ptsLabel')}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Competition() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = getUser();
  const isPro = user?.plan === 'pro';

  const [competition, setCompetition] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isParticipant, setIsParticipant] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [tokens, setTokens] = useState({ tokenBalance: 0, extraUploads: 0, extraQuizzes: 0 });
  const [userRank, setUserRank] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const [compRes, lbRes, tokenRes] = await Promise.all([
        API.get('/api/competition/current', { headers }),
        API.get('/api/competition/leaderboard', { headers }),
        API.get('/api/competition/tokens', { headers }),
      ]);
      setCompetition(compRes.data.competition);
      setIsParticipant(compRes.data.isParticipant);
      setDayOfWeek(compRes.data.dayOfWeek);
      setLeaderboard(lbRes.data.leaderboard || []);
      setUserRank(lbRes.data.userRank || 0);
      setTokens(tokenRes.data);
    } catch (error) {
      console.error('Competition fetch error:', error.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await API.post('/api/competition/join', {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      toast.success('You joined the competition! 🏆');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join competition');
    }
    setJoining(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary text-4xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-primary transition">
          <FaArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('weeklyCompetitionTitle')}</h1>
          <p className="text-gray-500 text-sm">{t('competeEarnRewards')}</p>
        </div>
        {userRank > 0 && (
          <div className="ml-auto bg-primary text-white px-3 py-1.5 rounded-xl text-sm font-bold">
            Rank {getRankIcon(userRank)}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-4">

        {!isPro && <TokenCard tokens={tokens} t={t} />}

        <CompetitionCard
          competition={competition}
          isParticipant={isParticipant}
          dayOfWeek={dayOfWeek}
          isPro={isPro}
          onJoin={handleJoin}
          joining={joining}
          t={t}
        />

        <Leaderboard
          leaderboard={leaderboard}
          userId={user?.id}
          competition={competition}
          t={t}
        />

        {competition?.winners?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg">{t('previousWinners')}</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {competition.winners.map((winner, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <span className="text-2xl">{getRankIcon(winner.rank)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{winner.fullName}</p>
                    <p className="text-xs text-green-600 font-medium">🎁 {winner.reward}</p>
                  </div>
                  <p className="font-black text-primary">{winner.points} {t('ptsLabel')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Competition;