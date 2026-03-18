import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { TopicBadge } from '../components/common/TopicBadge';
import { ProgressBar } from '../components/common/ProgressBar';
import { useProgressStore } from '../store/progressStore';
import { getAllQuestions, generateCalendarData, getStreakData, getGradeFromAccuracy } from '../utils/helpers';

export const Progress = () => {
  const progress = useProgressStore((state) => state.progress);
  const [stats, setStats] = useState(null);
  const [topicStats, setTopicStats] = useState([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const allQuestions = getAllQuestions();

    // Calculate overall stats
    let totalAttempted = 0;
    let totalCorrect = 0;

    Object.values(progress).forEach((item) => {
      if (item.attempts > 0) {
        totalAttempted += item.attempts;
        totalCorrect += item.correct;
      }
    });

    // Calculate topic stats
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
        correct: data.correct,
        attempts: data.attempts,
        total: data.total,
        remaining: data.total - data.attempts
      }))
      .sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));

    // Generate chart data from calendar
    const calendar = generateCalendarData(progress);
    const last30Days = Object.entries(calendar)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, 30)
      .reverse()
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        attempts: count
      }));

    setStats({
      totalQuestions: allQuestions.length,
      totalAttempted: Math.floor(totalAttempted),
      totalCorrect,
      accuracy: totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : 0
    });

    setTopicStats(topics);
    setStreakData(getStreakData(progress));
    setChartData(last30Days);
  }, [progress]);

  if (!stats) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center pb-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const gradeInfo = getGradeFromAccuracy(stats.accuracy);

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Progress & Analytics" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Overall Grade */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Overall Score</h2>
              <p className="text-purple-100">
                Based on {stats.totalAttempted} attempts across {stats.totalQuestions} questions
              </p>
            </div>
            <div className={`text-6xl font-bold ${gradeInfo.color}`}>
              {stats.accuracy}%
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-2">Correct Answers</div>
            <div className="text-3xl font-bold text-green-400">{stats.totalCorrect}</div>
            <div className="text-xs text-gray-500 mt-1">of {stats.totalAttempted}</div>
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-2">Current Streak</div>
            <div className="text-3xl font-bold text-orange-400">{streakData.currentStreak}</div>
            <div className="text-xs text-gray-500 mt-1">
              Best: {streakData.longestStreak}
            </div>
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-2">Completion</div>
            <div className="text-3xl font-bold text-blue-400">
              {Math.round((stats.totalAttempted / stats.totalQuestions) * 100)}%
            </div>
            <ProgressBar
              current={stats.totalAttempted}
              total={stats.totalQuestions}
              showLabel={false}
              height="h-1"
              className="mt-2"
            />
          </div>

          <div className="bg-navy-800 rounded-lg p-4 border border-navy-700">
            <div className="text-gray-400 text-sm mb-2">Remaining</div>
            <div className="text-3xl font-bold text-purple-400">
              {stats.totalQuestions - stats.totalAttempted}
            </div>
            <div className="text-xs text-gray-500 mt-1">questions to study</div>
          </div>
        </div>

        {/* Activity Chart */}
        {chartData.length > 0 && (
          <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
            <h3 className="text-lg font-bold text-gray-100 mb-4">Last 30 Days Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line
                  type="monotone"
                  dataKey="attempts"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Topic Breakdown */}
        <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
          <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-2">
            <TrendingUp size={20} />
            Topic Performance
          </h3>

          <div className="space-y-6">
            {topicStats.map((topic) => {
              const progress = topic.attempts > 0 ? (topic.attempts / topic.total) * 100 : 0;
              return (
                <div key={topic.topic}>
                  <div className="flex items-center justify-between mb-2">
                    <TopicBadge topic={topic.topic} />
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-100">
                        {topic.accuracy}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {topic.attempts}/{topic.total} attempted
                      </div>
                    </div>
                  </div>
                  <ProgressBar
                    current={topic.attempts}
                    total={topic.total}
                    showLabel={false}
                    height="h-2"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
