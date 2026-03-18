import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { QuestionCard } from '../components/common/QuestionCard';
import { ChoiceButton } from '../components/common/ChoiceButton';
import { ProgressBar } from '../components/common/ProgressBar';
import { useQuiz } from '../hooks/useQuiz';
import { useProgressStore } from '../store/progressStore';
import { getRandomQuestions, getAnswerChoices, getCorrectAnswer, getUniqueTopic } from '../utils/helpers';

export const Quiz = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [quizStarted, setQuizStarted] = useState(false);
  const [topics, setTopics] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const quiz = useQuiz();

  useEffect(() => {
    setTopics(getUniqueTopic());
  }, []);

  const startQuiz = () => {
    let questions;
    const allQuestions = quiz.questions && quiz.questions.length > 0 ? quiz.questions : getRandomQuestions(1000);

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
      const topicQuestions = allQuestions.filter((q) => q.topic === selectedTopic);
      questions = topicQuestions.length > 0 ? topicQuestions : getRandomQuestions(20);
    } else {
      questions = allQuestions;
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
                quiz.setQuestions(getRandomQuestions(20));
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

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title={`Quiz Mode`} />

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
        {isAnswered && quiz.currentQuestion.explanation && (
          <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-300 mb-2">Explanation:</h4>
            <p className="text-gray-200 text-sm leading-relaxed">
              {quiz.currentQuestion.explanation}
            </p>
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
                navigate('/');
              }}
              variant="success"
              size="lg"
              className="flex-1"
            >
              Complete Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
