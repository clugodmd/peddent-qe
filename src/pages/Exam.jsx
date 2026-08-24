import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { QuestionCard } from '../components/common/QuestionCard';
import { ChoiceButton } from '../components/common/ChoiceButton';
import { useQuiz } from '../hooks/useQuiz';
import { useTimer } from '../hooks/useTimer';
import { useProgressStore } from '../store/progressStore';
import { getRandomQuestions, getAnswerChoices, getCorrectAnswer, getAllQuestions } from '../utils/helpers';
import { EXAM_DURATIONS } from '../constants';

export const Exam = () => {
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(50);
  // skipped: Set of question IDs
  const [skipped, setSkipped] = useState(new Set());
  // reviewingSkipped: when true, we're iterating only through skipped questions
  const [reviewingSkipped, setReviewingSkipped] = useState(false);
  // skippedQueue: ordered list of indices to review
  const [skippedQueue, setSkippedQueue] = useState([]);
  const [skippedQueuePos, setSkippedQueuePos] = useState(0);

  const quiz = useQuiz();
  const timer = useTimer(0, () => {
    endExam();
  });

  const endExam = () => {
    navigate('/');
  };

  const startExam = () => {
    const allQs = getAllQuestions();
    const unseen = useProgressStore.getState().getUnattemptedQuestions(allQs);
    const unseenIds = new Set(unseen.map((q) => String(q.id)));
    const seenIds = unseen.length > 0 ? allQs.filter((q) => !unseenIds.has(String(q.id))).map((q) => q.id) : [];
    const questions = getRandomQuestions(questionCount, seenIds);
    quiz.setQuestions(questions);
    setSkipped(new Set());
    setReviewingSkipped(false);
    setExamStarted(true);
    timer.setCustomTime(EXAM_DURATIONS[questionCount] * 60);
    timer.start();
  };

  // Skip current question and advance
  const handleSkip = useCallback(() => {
    const q = quiz.currentQuestion;
    setSkipped((prev) => new Set([...prev, q.id]));
    if (quiz.currentIndex < quiz.questions.length - 1) {
      quiz.handleNext();
    }
  }, [quiz]);

  // Start reviewing skipped questions
  const startReviewSkipped = useCallback(() => {
    const indices = quiz.questions.reduce((acc, q, i) => {
      if (skipped.has(q.id)) acc.push(i);
      return acc;
    }, []);
    if (indices.length === 0) return;
    setSkippedQueue(indices);
    setSkippedQueuePos(0);
    quiz.goToQuestion(indices[0]);
    setReviewingSkipped(true);
  }, [quiz, skipped]);

  // When an answer is submitted during skip review, remove from skipped set
  const handleSubmitInReview = useCallback(() => {
    quiz.handleSubmitAnswer();
    const q = quiz.currentQuestion;
    setSkipped((prev) => {
      const next = new Set(prev);
      next.delete(q.id);
      return next;
    });
  }, [quiz]);

  // Advance to next skipped question
  const handleNextSkipped = useCallback(() => {
    const nextPos = skippedQueuePos + 1;
    if (nextPos < skippedQueue.length) {
      setSkippedQueuePos(nextPos);
      quiz.goToQuestion(skippedQueue[nextPos]);
    } else {
      // Done reviewing skipped — go back to normal flow
      setReviewingSkipped(false);
    }
  }, [skippedQueuePos, skippedQueue, quiz]);

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-navy-900 pb-32">
        <Header title="Exam Simulation" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-navy-800 rounded-xl p-6 mb-6 border border-navy-700">
            <h2 className="text-xl font-bold text-gray-100 mb-6">Configure Your Exam</h2>

            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-300 mb-4">
                Number of Questions:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`
                      p-4 rounded-lg transition-all font-bold text-lg
                      ${
                        questionCount === count
                          ? 'bg-blue-600 text-white'
                          : 'bg-navy-700 text-gray-300 hover:bg-navy-600'
                      }
                    `}
                  >
                    {count}
                    <div className="text-xs font-normal text-gray-400 mt-1">
                      {EXAM_DURATIONS[count]} min
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-600/20 border border-blue-500/50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-300 mb-2">Exam Rules:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• No immediate feedback on answers</li>
                <li>• Questions randomized</li>
                <li>• Cannot review questions during exam</li>
                <li>• Skip questions and return to them later</li>
                <li>• Results shown at end with detailed breakdown</li>
              </ul>
            </div>

            <Button
              onClick={startExam}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Start {questionCount}-Question Exam
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
  const skippedCount = skipped.size;
  const isCurrentSkipped = skipped.has(quiz.currentQuestion.id);
  const isLastQuestion = quiz.currentIndex === quiz.progress.total - 1;
  const isLastSkipped = reviewingSkipped && skippedQueuePos === skippedQueue.length - 1;

  // Question navigator — show dots with skipped indicator
  const navigatorDots = quiz.questions.map((q, i) => {
    const isAnswered = !!quiz.answers[q.id];
    const isSkippedQ = skipped.has(q.id);
    const isCurrent = i === quiz.currentIndex;
    return (
      <button
        key={q.id}
        onClick={() => {
          setReviewingSkipped(false);
          quiz.goToQuestion(i);
        }}
        title={isSkippedQ ? 'Skipped' : isAnswered ? 'Answered' : 'Unanswered'}
        className={`
          w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all
          ${isCurrent ? 'ring-2 ring-white scale-110' : ''}
          ${isSkippedQ ? 'bg-amber-500 text-white' : isAnswered ? 'bg-green-600 text-white' : 'bg-navy-600 text-gray-400'}
        `}
      >
        {isSkippedQ ? '🔖' : i + 1}
      </button>
    );
  });

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      {/* Header with Timer */}
      <div className="sticky top-0 bg-navy-800 border-b border-navy-700 z-30">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div>
            <div className="text-sm text-gray-400">
              {reviewingSkipped
                ? `Reviewing skipped • ${skippedQueuePos + 1} of ${skippedQueue.length}`
                : `Question ${quiz.progress.current} of ${quiz.progress.total}${skippedCount > 0 ? ` • ${skippedCount} skipped` : ''}`}
            </div>
          </div>

          <div className={`
            flex items-center gap-2 text-2xl font-bold
            ${timer.time < 300 ? 'text-red-500' : 'text-blue-400'}
          `}>
            <Clock size={24} />
            {timer.display}
          </div>
        </div>

        {/* Question navigator dots (scrollable) */}
        <div className="px-4 pb-3 max-w-4xl mx-auto overflow-x-auto">
          <div className="flex gap-1.5 flex-wrap">
            {navigatorDots}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Skipped banner */}
        {isCurrentSkipped && (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-lg px-4 py-2 mb-4 text-amber-300 text-sm font-medium">
            <Bookmark size={15} />
            This question was skipped — answer it now or skip again
          </div>
        )}

        {/* Review skipped banner */}
        {reviewingSkipped && (
          <div className="bg-blue-600/20 border border-blue-500/40 rounded-lg px-4 py-2 mb-4 text-blue-300 text-sm font-medium">
            Reviewing skipped questions — {skippedQueue.length - skippedQueuePos} remaining
          </div>
        )}

        {/* Question Card */}
        <QuestionCard
          question={quiz.currentQuestion}
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
              onClick={() => quiz.handleAnswerSelect(choice.value)}
              isDisabled={quiz.answered}
              showFeedback={false}
            />
          ))}
        </div>

        {/* Action buttons row */}
        {!quiz.answered && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={reviewingSkipped ? handleSubmitInReview : quiz.handleSubmitAnswer}
              disabled={!quiz.selectedAnswer}
              variant="primary"
              size="lg"
              className="flex-1"
            >
              Submit Answer
            </Button>
            <Button
              onClick={handleSkip}
              variant="secondary"
              size="lg"
              className="flex items-center gap-2 px-5"
              title="Skip and return later"
            >
              <Bookmark size={16} />
              Skip
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 justify-between mb-4">
          {!reviewingSkipped && (
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
          )}

          {reviewingSkipped ? (
            <>
              {isLastSkipped ? (
                <Button
                  onClick={() => setReviewingSkipped(false)}
                  variant="success"
                  size="lg"
                  className="flex-1"
                >
                  Done Reviewing
                </Button>
              ) : (
                <Button
                  onClick={handleNextSkipped}
                  variant="primary"
                  size="lg"
                  className="flex items-center gap-2 flex-1"
                >
                  Next Skipped
                  <ChevronRight size={20} />
                </Button>
              )}
            </>
          ) : (
            <>
              {quiz.answered && !isLastQuestion && (
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

              {isLastQuestion && (
                <Button
                  onClick={endExam}
                  variant="success"
                  size="lg"
                  className="flex-1"
                >
                  End Exam & See Results
                </Button>
              )}
            </>
          )}
        </div>

        {/* Review Skipped button — always visible when there are skipped questions */}
        {skippedCount > 0 && !reviewingSkipped && (
          <Button
            onClick={startReviewSkipped}
            variant="outline"
            size="lg"
            className="w-full flex items-center justify-center gap-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
          >
            <Bookmark size={18} />
            Review Skipped ({skippedCount})
          </Button>
        )}
      </div>
    </div>
  );
};
