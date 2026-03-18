import { useState, useEffect } from 'react';
import { Search, ChevronDown, Flag } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { TopicBadge } from '../components/common/TopicBadge';
import { useProgressStore } from '../store/progressStore';
import { getAllQuestions, getUniqueTopic, searchQuestions, getAnswerChoices, getCorrectAnswer } from '../utils/helpers';

export const Review = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [topics, setTopics] = useState([]);

  const progress = useProgressStore((state) => state.progress);
  const toggleFlag = useProgressStore((state) => state.toggleFlag);

  useEffect(() => {
    const all = getAllQuestions();
    setQuestions(all);
    setTopics(getUniqueTopic());
  }, []);

  useEffect(() => {
    let filtered = questions;

    // Search filter
    if (searchTerm) {
      filtered = searchQuestions(searchTerm);
    }

    // Topic filter
    if (selectedTopic !== 'all') {
      filtered = filtered.filter((q) => q.topic === selectedTopic);
    }

    // Status filter
    if (filterMode === 'flagged') {
      const flaggedIds = Object.entries(progress)
        .filter(([, p]) => p.flagged)
        .map(([id]) => parseInt(id));
      filtered = filtered.filter((q) => flaggedIds.includes(q.id));
    } else if (filterMode === 'incorrect') {
      const incorrectIds = Object.entries(progress)
        .filter(([, p]) => p.attempts > p.correct)
        .map(([id]) => parseInt(id));
      filtered = filtered.filter((q) => incorrectIds.includes(q.id));
    } else if (filterMode === 'unattempted') {
      filtered = filtered.filter((q) => !progress[q.id] || progress[q.id].attempts === 0);
    }

    setFilteredQuestions(filtered);
  }, [questions, searchTerm, selectedTopic, filterMode, progress]);

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Review Questions" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search questions, answers, explanations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="
              w-full pl-10 pr-4 py-3 rounded-lg
              bg-navy-800 border border-navy-700 focus:border-blue-500
              text-gray-100 placeholder-gray-500 focus:outline-none
            "
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'flagged', label: 'Flagged' },
            { id: 'incorrect', label: 'Wrong' },
            { id: 'unattempted', label: 'New' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setFilterMode(option.id)}
              className={`
                p-2 rounded-lg transition-all text-sm font-medium
                ${
                  filterMode === option.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                }
              `}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Topic Select */}
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="
            w-full mb-6 bg-navy-800 text-gray-100 rounded-lg p-3
            border border-navy-700 focus:border-blue-500 focus:outline-none
          "
        >
          <option value="all">All Topics</option>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>

        {/* Results Count */}
        <div className="text-sm text-gray-400 mb-6">
          Showing {filteredQuestions.length} of {questions.length} questions
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const qProgress = progress[question.id];
            const isFlagged = qProgress?.flagged || false;
            const isExpanded = expandedId === question.id;
            const isAttempted = qProgress && qProgress.attempts > 0;
            const isCorrect = qProgress && qProgress.correct > 0;
            const choices = getAnswerChoices(question);
            const correctAnswer = getCorrectAnswer(question);

            return (
              <div key={question.id} className="bg-navy-800 rounded-lg border border-navy-700 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  className="w-full p-4 text-left hover:bg-navy-700/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <TopicBadge topic={question.topic} />
                      {isAttempted && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            isCorrect
                              ? 'bg-green-600/30 text-green-300'
                              : 'bg-red-600/30 text-red-300'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      )}
                      {isFlagged && (
                        <Flag size={14} className="fill-amber-500 text-amber-500" />
                      )}
                    </div>
                    <p className="text-gray-200 font-semibold text-sm leading-snug">
                      Q{question.id}: {question.question}
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-navy-700 p-4 bg-navy-900/50">
                    {/* Choices */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Options:</h4>
                      <div className="space-y-2">
                        {choices.map((choice) => {
                          const isCorrectChoice = correctAnswer?.label === choice.label;
                          return (
                            <div
                              key={choice.value}
                              className={`p-3 rounded-lg border ${
                                isCorrectChoice
                                  ? 'bg-green-600/20 border-green-500/50'
                                  : 'bg-navy-700 border-navy-600'
                              }`}
                            >
                              <div className="font-semibold text-white">
                                {choice.label}.{' '}
                                {choice.text}
                                {isCorrectChoice && ' ✓'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mb-4 p-3 bg-blue-600/20 border border-blue-500/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-300 mb-2">
                          Explanation:
                        </h4>
                        <p className="text-sm text-gray-200 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>
                    )}

                    {/* Stats */}
                    {isAttempted && (
                      <div className="mb-4 p-3 bg-navy-700 rounded-lg">
                        <p className="text-xs text-gray-400">
                          Attempts: {qProgress.attempts} | Correct: {qProgress.correct} |
                          Accuracy: {((qProgress.correct / qProgress.attempts) * 100).toFixed(0)}%
                        </p>
                      </div>
                    )}

                    {/* Flag Button */}
                    <button
                      onClick={() => toggleFlag(question.id)}
                      className={`
                        text-sm py-2 px-3 rounded-lg transition-all
                        ${
                          isFlagged
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50'
                            : 'bg-navy-700 text-gray-300 border border-navy-600 hover:bg-navy-600'
                        }
                      `}
                    >
                      {isFlagged ? '★ Flagged' : '☆ Flag for Review'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No questions found</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTopic('all');
                setFilterMode('all');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
