import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { QuestionCard } from '../components/common/QuestionCard';
import { ChoiceButton } from '../components/common/ChoiceButton';
import { useQuiz } from '../hooks/useQuiz';
import { useTimer } from '../hooks/useTimer';
import { useProgressStore } from '../store/progressStore';
import { getRandomQuestions, getAnswerChoices, getCorrectAnswer } from '../utils/helpers';
import { EXAM_DURATIONS } from '../constants';

export const Exam = () => {
  const navigate = useNavigate();
  const [examStarted, setExamStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(50);
  const quiz = useQuiz();
  const timer = useTimer(0, () => {
    endExam();
  });

  const endExam = () => {
    navigate('/');
  };

  const startExam = () => {
    const questions = getRandomQuestions(questionCount);
    quiz.setQuestions(questions);
    setExamStarted(true);
    timer.setCustomTime(EXAM_DURATIONS[questionCount] * 60);
    timer.start();
  };

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

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      {/* Header with Timer */}
      <div className="sticky top-0 bg-navy-800 border-b border-navy-700 z-30">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div>
            <div className="text-sm text-gray-400">
              Question {quiz.progress.current} of {quiz.progress.total}
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
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
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

        {/* Submit Button */}
        {!quiz.answered && (
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

          {quiz.answered && quiz.currentIndex < quiz.progress.total - 1 && (
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

          {quiz.answered && quiz.currentIndex === quiz.progress.total - 1 && (
            <Button
              onClick={endExam}
              variant="success"
              size="lg"
              className="flex-1"
            >
              End Exam & See Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
