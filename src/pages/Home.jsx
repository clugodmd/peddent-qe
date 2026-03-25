import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDemo } from '../context/DemoContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Play, Zap, Lightbulb, BookOpen, TrendingUp, Flame, AlertCircle } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { TopicBadge } from '../components/common/TopicBadge';
import { useProgressStore } from '../store/progressStore';
import { getAllQuestions, getStreakData, getUniqueTopic } from '../utils/helpers';

export const Home = () => {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const progress = useProgressStore((state) => state.progress);

  // Demo users go straight to quiz — no browsing home page
  useEffect(() => {
    if (isDemoMode) navigate('/quiz', { replace: true });
  }, [isDemoMode, navigate]);
  const [stats, setStats] = useState(null);
  const [topicStats, setTopicStats] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });

  // Calculate missed questions count
  const missedCount = useMemo(() => {
    const allQuestions = getAllQuestions();
    const missed = allQuestions.filter((question) => {
      const qProgress = progress[question.id];
      if (!qProgress || qProgress.attempts === 0) return false;
      return qProgress.correct < qProgress.attempts;
    });
    return missed.length;
  }, [progress]);

  useEffect(() => {
    const allQuestions = getAllQuestions();
    const totalQuestions = allQuestions.length;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let lastSeen = null;

    Object.values(progress).forEach((item) => {
      if (item.attempts > 0) {
        totalAttempted += item.attempts;
        totalCorrect += item.correct;
        if (!lastSeen || item.lastSeen > lastSeen) {
          lastSeen = item.lastSeen;
        }
      }
    });

    const topicMap = {};
    allQuestions.forEach((q) => {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = { correct: 0, attempts: 0, total: 0 };
      }
      topicMap[q.topic].total += 1;

      const qProgress = progress[q.id];
      if (qProgress && qProgress.attempts > 0) {
        topicMap[q.topic].attempts += qProgress.attempts;
        topicMap[q.topic].correct += qProgress.correct;
      }
    });

    const topics = Object.entries(topicMap)
      .map(([topic, data]) => ({
        topic,
        accuracy: data.attempts > 0 ? ((data.correct / data.attempts) * 100).toFixed(1) : 0,
        attempted: data.attempts > 0 ? 1 : 0,
        total: data.total
      }))
      .sort((a, b) => b.attempted - a.attempted)
      .slice(0, 5);

    setStats({
      totalQuestions,
      totalAttempted: Math.floor(totalAttempted / 1),
      totalCorrect,
      accuracy: totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : 0,
      lastSeen
    });

    setTopicStats(topics);
    setStreakData(getStreakData(progress));
  }, [progress]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="PedBoards QE" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-blue-100">
            You have {stats.totalQuestions - stats.totalAttempted} questions remaining to master
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-1">Accuracy</div>
            <div className="text-3xl font-bold text-green-400">{stats.accuracy}%</div>
            <div className="text-xs text-gray-500 mt-2">
              {stats.totalCorrect} of {stats.totalAttempted} correct
            </div>
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <Flame size={16} />
              Streak
            </div>
            <div className="text-3xl font-bold text-orange-400">{streakData.currentStreak}</div>
            <div className="text-xs text-gray-500 mt-2">
              Longest: {streakData.longestStreak} days
            </div>
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-1">Attempted</div>
            <div className="text-3xl font-bold text-blue-400">{stats.totalAttempted}</div>
            <div className="text-xs text-gray-500 mt-2">
              of {stats.totalQuestions} questions
            </div>
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-1">Progress</div>
            <div className="text-3xl font-bold text-purple-400">
              {Math.floor((stats.totalAttempted / stats.totalQuestions) * 100)}%
            </div>
            <ProgressBar
              current={stats.totalAttempted}
              total={stats.totalQuestions}
              showLabel={false}
              height="h-1"
              className="mt-2"
            />
          </div>
        </div>

        {/* Topic Performance */}
        {topicStats.length > 0 && (
          <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Top Topics</h2>
            <div className="space-y-3">
              {topicStats.slice(0, 5).map((topic) => (
                <div key={topic.topic}>
                  <div className="flex justify-between items-center mb-1">
                    <TopicBadge topic={topic.topic} />
                    <span className="text-sm text-gray-400">
                      {topic.accuracy}% • {topic.total} questions
                    </span>
                  </div>
                  <ProgressBar
                    current={topic.attempted}
                    total={topic.total}
                    showLabel={false}
                    height="h-1.5"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missed Questions Alert */}
        {missedCount > 0 && (
          <div className="bg-orange-600/20 border border-orange-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-300 mb-1">
                  {missedCount} Question{missedCount !== 1 ? 's' : ''} to Review
                </h3>
                <p className="text-orange-100 text-sm mb-3">
                  You have {missedCount} question{missedCount !== 1 ? 's' : ''} you answered incorrectly. Review them to improve your understanding.
                </p>
                <Button
                  onClick={() => navigate('/missed')}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <AlertCircle size={16} />
                  View Missed Questions
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Button
            onClick={() => navigate('/quiz')}
            variant="primary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <Play size={20} />
            Quick Quiz
          </Button>

          <Button
            onClick={() => navigate('/exam')}
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <Zap size={20} />
            Exam Simulation
          </Button>

          <Button
            onClick={() => navigate('/flashcards')}
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <Lightbulb size={20} />
            Flashcards
          </Button>

          <Button
            onClick={() => navigate('/review')}
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <BookOpen size={20} />
            Review Questions
          </Button>
        </div>
      </div>
    </div>
  );
};
