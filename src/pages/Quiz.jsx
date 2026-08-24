import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { QuestionCard } from '../components/common/QuestionCard';
import { ChoiceButton } from '../components/common/ChoiceButton';
import { ProgressBar } from '../components/common/ProgressBar';
import { TutorBot } from '../components/TutorBot';
import { useQuiz } from '../hooks/useQuiz';
import { useProgressStore } from '../store/progressStore';
import { getRandomQuestions, getAnswerChoices, getCorrectAnswer, getUniqueTopic, getAllQuestions } from '../utils/helpers';
import { useDemo } from '../context/DemoContext';
import { useAuth } from '../context/AuthContext';
import { loadUserStats } from '../services/firestoreProgress';
import { getAdaptiveQuestions } from '../utils/tutorBot';

export const Quiz = () => {
  const navigate = useNavigate();
  const { isDemoMode, exitDemo, DEMO_QUESTION_LIMIT } = useDemo();
  const { user } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [quizStarted, setQuizStarted] = useState(false);
  const [demoComplete, setDemoComplete] = useState(false);
  const [topics, setTopics] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [topicBreakdown, setTopicBreakdown] = useState({});
  const quiz = useQuiz();

  // Load user's topic performance for adaptive mode
  useEffect(() => {
    if (user && !isDemoMode) {
      loadUserStats(user.uid).then(stats => {
        if (stats?.topicBreakdown) setTopicBreakdown(stats.topicBreakdown);
      });
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    setTopics(getUniqueTopic());
  }, []);

  // Auto-start quiz in demo mode with limited questions
  useEffect(() => {
    if (isDemoMode && !quizStarted) {
      const seen = Object.entries(useProgressStore.getState().progress || {})
      .filter(([, p]) => p && p.attempts > 0)
      .map(([id]) => id);
    quiz.setQuestions(getRandomQuestions(DEMO_QUESTION_LIMIT, seen));
      setQuizStarted(true);
    }
  }, [isDemoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const startQuiz = () => {
    let questions;
    const allQuestions = getAllQuestions();
    const unseen = useProgressStore.getState().getUnattemptedQuestions(allQuestions);
    const pool = unseen.length > 0 ? unseen : allQuestions;

    if (filterMode === 'flagged') {
      const flaggedIds = useProgressStore.getState().getFlaggedQuestions();
      questions = allQuestions.filter((q) => flaggedIds.includes(q.id));
    } else if (filterMode === 'incorrect') {
      const incorrect = useProgressStore.getState().getIncorrectQuestions(allQuestions);
      questions = allQuestions.filter((q) => incorrect.includes(q.id));
    } else if (filterMode === 'unattempted') {
      const unattempted = useProgressStore.getState().getUnattemptedQuestions(allQuestions);
      questions = allQuestions.filter((q) => unattempted.includes(q.id));
    } else if (selectedTopic !== 'all') {
      const topicQuestions = pool.filter((q) => q.topic === selectedTopic);
      questions = topicQuestions.length > 0 ? topicQuestions : pool.slice(0, 20);
    } else {
      questions = getAdaptiveQuestions(pool, topicBreakdown, 20);
    }

    if (questions.length === 0) {
      alert('No questions available for this filter');
      return;
    }

    quiz.setQuestions(questions.sort(() => Math.random() - 0.5).slice(0, 20));
    setQuizStarted(true);
  };

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-navy-900 pb-32">
        <Header title="Quiz Mode" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Quiz Settings</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Filter by:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Questions' },
                  { id: 'flagged', label: 'Flagged' },
                  { id: 'incorrect', label: 'Previously Wrong' },
                  { id: 'unattempted', label: 'Not Attempted' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilterMode(option.id)}
                    className={`
                      p-3 rounded-lg transition-all text-sm font-medium
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
            </div>

            {filterMode === 'all' && Object.keys(topicBreakdown).length > 0 && selectedTopic === 'all' && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-purple-900/30 border border-purple-500/30 text-sm text-purple-300">
                🎯 <strong>Adaptive Mode:</strong> Questions weighted toward your weak areas
              </div>
            )}
            {filterMode === 'all' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Topic:
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-navy-700 text-gray-100 rounded-lg p-3 border border-navy-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="all">All Topics</option>
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={() => {
                const seenIds = Object.entries(useProgressStore.getState().progress || {}).filter(([, p]) => p && p.attempts > 0).map(([id]) => id);
    quiz.setQuestions(getRandomQuestions(20, seenIds));
                startQuiz();
              }}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Start Quiz (20 Questions)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz.currentQuestion) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center pb-32">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  const choices = getAnswerChoices(quiz.currentQuestion);
  const correctAnswer = getCorrectAnswer(quiz.currentQuestion);
  const userAnswer = quiz.answers[quiz.currentQuestion.id];
  const isAnswered = !!userAnswer;

  // Demo conversion screen — shown after completing all demo questions
  if (isDemoMode && demoComplete) {
    const totalQuestions = getAllQuestions().length;
    return (
      <div className="min-h-screen bg-navy-900 pb-32">
        <Header title="Demo Complete" />
        <div className="max-w-md mx-auto px-4 py-12">
          <div className="bg-navy-800 border border-navy-700 rounded-2xl p-8 text-center shadow-xl">
            <div className="text-5xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Ready to start studying?
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              You've seen what PedBoards QE can do. Get full access to all {totalQuestions.toLocaleString()} questions and the AI Smart Tutor.
            </p>

            <div className="bg-navy-900 border border-navy-600 rounded-xl p-5 mb-6 text-left">
              <h3 className="text-green-400 font-semibold mb-3">Your subscription includes:</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ {totalQuestions.toLocaleString()} board-style questions</li>
                <li>✅ AI Smart Tutor — instant explanations on every question</li>
                <li>✅ Progress tracking & analytics</li>
                <li>✅ Exam simulation mode</li>
                <li>✅ Spaced repetition & flagging</li>
              </ul>
            </div>

            <p className="text-gray-400 text-sm mb-4">$35/month · Cancel anytime</p>

            <a
              href="https://buy.stripe.com/7sY00j8Ig4tEfGNdCugjC01"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors text-center mb-3"
            >
              Start Studying — $35/month →
            </a>
            <button
              onClick={() => setDemoComplete(false)}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Review your answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title={`Quiz Mode`} />

      {/* Demo banner */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white text-center py-2.5 px-4 text-sm font-medium sticky top-0 z-50">
          🎯 Demo Mode — {DEMO_QUESTION_LIMIT} questions · No account needed ·{' '}
          <a
            href={window.location.origin + window.location.pathname}
            onClick={exitDemo}
            className="underline font-bold hover:text-green-300 transition-colors"
          >
            Start Free Trial →
          </a>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <ProgressBar
            current={quiz.progress.current}
            total={quiz.progress.total}
            showLabel={true}
            height="h-2"
          />
        </div>

        {/* Question Card */}
        <QuestionCard
          question={quiz.currentQuestion}
          onFlagToggle={quiz.handleToggleFlag}
          isFlagged={quiz.flagged.has(quiz.currentQuestion.id)}
          questionNumber={quiz.progress.current}
          totalQuestions={quiz.progress.total}
        />

        {/* Answer Choices */}
        <div className="mb-6">
          {choices.map((choice) => (
            <ChoiceButton
              key={choice.value}
              choice={choice}
              isSelected={quiz.selectedAnswer === choice.value}
              isCorrect={isAnswered && correctAnswer?.label === choice.label}
              isIncorrect={
                isAnswered &&
                quiz.selectedAnswer === choice.value &&
                correctAnswer?.label !== choice.label
              }
              onClick={() => quiz.handleAnswerSelect(choice.value)}
              isDisabled={isAnswered}
              showFeedback={isAnswered}
            />
          ))}
        </div>

        {/* Submit Button */}
        {!isAnswered && (
          <Button
            onClick={quiz.handleSubmitAnswer}
            disabled={!quiz.selectedAnswer}
            variant="primary"
            size="lg"
            className="w-full mb-6"
          >
            Submit Answer
          </Button>
        )}

        {/* Explanation */}
        {isAnswered && (quiz.currentQuestion.explanation || quiz.currentQuestion.source_url) && (
          <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            {quiz.currentQuestion.explanation && (
              <>
                <h4 className="font-semibold text-blue-300 mb-2">Explanation:</h4>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {quiz.currentQuestion.explanation}
                </p>
              </>
            )}
            {quiz.currentQuestion.source_url && (
              <div className={quiz.currentQuestion.explanation ? 'mt-3 pt-3 border-t border-blue-500/30' : ''}>
                <a
                  href={quiz.currentQuestion.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs hover:underline"
                  style={{ color: 'var(--text3, #6b7280)' }}
                >
                  📖 AAPD Guidelines
                </a>
              </div>
            )}
            
            {/* Smart Tutor Bot - Get AI explanation for any answer */}
            {quiz.selectedAnswer && (
              <div className="mt-4 pt-4 border-t border-blue-500/30">
                <TutorBot
                  question={quiz.currentQuestion.question}
                  userAnswer={quiz.selectedAnswer || 'N/A'}
                  correctAnswer={getCorrectAnswer(quiz.currentQuestion)?.label || 'N/A'}
                  showAnswer={true}
                  isPaid={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-between">
          <Button
            onClick={quiz.handlePrev}
            disabled={quiz.currentIndex === 0}
            variant="secondary"
            size="lg"
            className="flex items-center gap-2 flex-1"
          >
            <ChevronLeft size={20} />
            Previous
          </Button>

          {isAnswered && quiz.currentIndex < quiz.progress.total - 1 && (
            <Button
              onClick={quiz.handleNext}
              variant="primary"
              size="lg"
              className="flex items-center gap-2 flex-1"
            >
              Next
              <ChevronRight size={20} />
            </Button>
          )}

          {isAnswered && quiz.currentIndex === quiz.progress.total - 1 && (
            <Button
              onClick={() => {
                if (isDemoMode) {
                  setDemoComplete(true);
                } else {
                  navigate('/');
                }
              }}
              variant="success"
              size="lg"
              className="flex-1"
            >
              {isDemoMode ? 'See Results →' : 'Complete Quiz'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
