import { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { TopicBadge } from '../components/common/TopicBadge';
import { Button } from '../components/common/Button';
import { useProgressStore } from '../store/progressStore';
import { getAllQuestions, getUniqueTopic, getAnswerChoices, getCorrectAnswer } from '../utils/helpers';

export const MissedQuestions = () => {
  const progress = useProgressStore((state) => state.progress);
  const [missedQuestions, setMissedQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const allQuestions = getAllQuestions();
    const allTopics = getUniqueTopic();
    setTopics(allTopics);

    // Find all missed questions (where resident answered incorrectly)
    const missed = allQuestions.filter((question) => {
      const qProgress = progress[question.id];
      // A question is "missed" if it was attempted but not all attempts were correct
      if (!qProgress || qProgress.attempts === 0) return false;
      return qProgress.correct < qProgress.attempts;
    });

    setMissedQuestions(missed);
    setIsLoading(false);
  }, [progress]);

  useEffect(() => {
    let filtered = [...missedQuestions];

    // Filter by topic
    if (selectedTopic !== 'all') {
      filtered = filtered.filter((q) => q.topic === selectedTopic);
    }

    // Sort
    if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = progress[a.id]?.lastSeen || 0;
        const bTime = progress[b.id]?.lastSeen || 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'mostWrong') {
      filtered.sort((a, b) => {
        const aWrong = (progress[a.id]?.attempts || 0) - (progress[a.id]?.correct || 0);
        const bWrong = (progress[b.id]?.attempts || 0) - (progress[b.id]?.correct || 0);
        return bWrong - aWrong;
      });
    } else if (sortBy === 'topic') {
      filtered.sort((a, b) => a.topic.localeCompare(b.topic));
    }

    setFilteredQuestions(filtered);
  }, [missedQuestions, selectedTopic, sortBy, progress]);

  const toggleExpandQuestion = (questionId) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  const getMissedQuestionStats = (questionId) => {
    const qProgress = progress[questionId];
    if (!qProgress) return { attempts: 0, correct: 0, missed: 0 };
    return {
      attempts: qProgress.attempts || 0,
      correct: qProgress.correct || 0,
      missed: (qProgress.attempts || 0) - (qProgress.correct || 0)
    };
  };

  const getResidentAnswer = (question) => {
    const qProgress = progress[question.id];
    if (!qProgress || !qProgress.answer) return null;
    const answerKey = qProgress.answer.toLowerCase();
    const choices = getAnswerChoices(question);
    const choice = choices.find((c) => c.value === answerKey);
    return choice;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center pb-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  if (missedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-navy-900 pb-32">
        <Header title="Missed Questions" />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-navy-800 rounded-xl p-8 border border-navy-700 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <AlertCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">No Missed Questions</h2>
            <p className="text-gray-400 mb-6">
              Great work! You haven't missed any questions yet. Keep studying and practicing!
            </p>
            <a
              href="/#/quiz"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start a Quiz
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Missed Questions" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary Badge */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Questions to Review</h2>
              <p className="text-orange-100 text-sm">
                {missedQuestions.length} question{missedQuestions.length !== 1 ? 's' : ''} answered incorrectly
              </p>
            </div>
            <div className="text-4xl font-bold">{missedQuestions.length}</div>
          </div>
        </div>

        {/* Filter & Sort Controls */}
        <div className="bg-navy-800 rounded-xl p-4 mb-6 border border-navy-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                <Filter size={14} className="inline mr-1" />
                Topic
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-navy-700 text-gray-100 rounded-lg px-3 py-2 border border-navy-600 focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="all">All Topics ({missedQuestions.length})</option>
                {topics.map((topic) => {
                  const count = missedQuestions.filter((q) => q.topic === topic).length;
                  return (
                    <option key={topic} value={topic}>
                      {topic} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-navy-700 text-gray-100 rounded-lg px-3 py-2 border border-navy-600 focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="recent">Most Recent</option>
                <option value="mostWrong">Most Wrong</option>
                <option value="topic">By Topic</option>
              </select>
            </div>
          </div>
        </div>

        {/* No Results for Filter */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-navy-800 rounded-xl p-8 border border-navy-700 text-center">
            <p className="text-gray-400">No missed questions in this topic.</p>
          </div>
        ) : (
          /* Questions List */
          <div className="space-y-4">
            {filteredQuestions.map((question) => {
              const isExpanded = expandedQuestionId === question.id;
              const stats = getMissedQuestionStats(question.id);
              const residentAnswer = getResidentAnswer(question);
              const correctAnswer = getCorrectAnswer(question);

              return (
                <div
                  key={question.id}
                  className="bg-navy-800 rounded-xl border border-navy-700 overflow-hidden hover:border-orange-500/50 transition-colors"
                >
                  {/* Collapsed Header */}
                  <button
                    onClick={() => toggleExpandQuestion(question.id)}
                    className="w-full text-left p-4 hover:bg-navy-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <TopicBadge topic={question.topic} />
                          <span className="text-xs text-gray-500">
                            Question #{question.id}
                          </span>
                        </div>
                        <p className="text-gray-100 font-medium text-sm line-clamp-2">
                          {question.question_text || question.question}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Attempt Count Badge */}
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {stats.missed === 1 ? '1 miss' : `${stats.missed} misses`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {stats.correct}/{stats.attempts}
                          </div>
                        </div>

                        {/* Expand Icon */}
                        {isExpanded ? (
                          <ChevronUp size={20} className="text-gray-400" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-navy-700 p-4 bg-navy-800/50">
                      {/* Question Text */}
                      <div className="mb-4 pb-4 border-b border-navy-700">
                        <p className="text-gray-200 text-sm">
                          {question.question_text || question.question}
                        </p>
                      </div>

                      {/* Answer Choices */}
                      <div className="mb-4 pb-4 border-b border-navy-700">
                        <div className="space-y-2">
                          {getAnswerChoices(question).map((choice) => {
                            const isResidentAnswer = residentAnswer?.value === choice.value;
                            const isCorrect = correctAnswer?.value === choice.value;
                            const isWrong = isResidentAnswer && !isCorrect;

                            return (
                              <div
                                key={choice.value}
                                className={`
                                  p-3 rounded-lg text-sm border transition-colors
                                  ${
                                    isCorrect
                                      ? 'bg-green-500/15 border-green-500/50 text-green-100'
                                      : isWrong
                                        ? 'bg-red-500/15 border-red-500/50 text-red-100'
                                        : 'bg-navy-700/50 border-navy-600 text-gray-300'
                                  }
                                `}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="font-bold min-w-fit">{choice.label}.</span>
                                  <span className="flex-1">{choice.text}</span>

                                  {isResidentAnswer && !isCorrect && (
                                    <span className="ml-2 text-sm font-semibold">❌ Your answer</span>
                                  )}
                                  {isCorrect && (
                                    <span className="ml-2 text-sm font-semibold">✅ Correct</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation */}
                      {(question.explanation || question.source_url) && (
                        <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4">
                          {question.explanation && (
                            <>
                              <h4 className="font-semibold text-blue-300 mb-2 text-sm">
                                Why This Matters:
                              </h4>
                              <p className="text-gray-200 text-sm leading-relaxed">
                                {question.explanation}
                              </p>
                            </>
                          )}
                          {question.source_url && (
                            <div className={question.explanation ? 'mt-3 pt-3 border-t border-blue-500/30' : ''}>
                              <a
                                href={question.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-300 hover:text-blue-200 hover:underline transition-colors"
                              >
                                📖 Learn more (AAPD Guidelines)
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="mt-4 pt-4 border-t border-navy-700">
                        <div className="grid grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <div className="text-gray-500 text-xs">Total Attempts</div>
                            <div className="text-lg font-bold text-gray-100">
                              {stats.attempts}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Correct</div>
                            <div className="text-lg font-bold text-green-400">
                              {stats.correct}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-xs">Missed</div>
                            <div className="text-lg font-bold text-red-400">
                              {stats.missed}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Last Seen */}
                      <div className="mt-4 text-center text-xs text-gray-500">
                        Last reviewed:{' '}
                        {progress[question.id]?.lastSeen
                          ? new Date(progress[question.id].lastSeen).toLocaleDateString()
                          : 'Unknown'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
