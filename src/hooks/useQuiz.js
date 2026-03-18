import { useState, useCallback, useEffect } from 'react';
import { useProgressStore } from '../store/progressStore';
import { getAllQuestions, shuffleArray } from '../utils/helpers';

export const useQuiz = (initialQuestions = null) => {
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const recordAttempt = useProgressStore((state) => state.recordAttempt);
  const getQuestionProgress = useProgressStore((state) => state.getQuestionProgress);

  const currentQuestion = questions[currentIndex];

  const handleAnswerSelect = useCallback((answer) => {
    if (!answered) {
      setSelectedAnswer(answer);
    }
  }, [answered]);

  const handleSubmitAnswer = useCallback(() => {
    if (selectedAnswer) {
      const isCorrect = currentQuestion.answer?.toLowerCase() === selectedAnswer.toLowerCase();
      setAnswers({
        ...answers,
        [currentQuestion.id]: {
          selected: selectedAnswer,
          correct: isCorrect,
          timestamp: Date.now()
        }
      });
      recordAttempt(currentQuestion.id, isCorrect);
      setAnswered(true);
    }
  }, [selectedAnswer, currentQuestion, answers, recordAttempt]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }, [currentIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(answers[questions[currentIndex - 1]?.id]?.selected || null);
      setAnswered(!!answers[questions[currentIndex - 1]?.id]);
    }
  }, [currentIndex, questions, answers]);

  const handleToggleFlag = useCallback(() => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(currentQuestion.id)) {
      newFlagged.delete(currentQuestion.id);
    } else {
      newFlagged.add(currentQuestion.id);
    }
    setFlagged(newFlagged);
  }, [currentQuestion, flagged]);

  const toggleQuestionFlag = useCallback((questionId) => {
    const newFlagged = new Set(flagged);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlagged(newFlagged);
  }, [flagged]);

  const goToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
      setSelectedAnswer(answers[questions[index]?.id]?.selected || null);
      setAnswered(!!answers[questions[index]?.id]);
    }
  }, [questions, answers]);

  const getStats = useCallback(() => {
    let correct = 0;
    let total = 0;
    Object.values(answers).forEach((answer) => {
      total += 1;
      if (answer.correct) correct += 1;
    });
    return {
      correct,
      total,
      accuracy: total > 0 ? ((correct / total) * 100).toFixed(1) : 0,
      remaining: questions.length - total
    };
  }, [answers, questions]);

  return {
    questions,
    setQuestions,
    currentIndex,
    currentQuestion,
    selectedAnswer,
    answered,
    answers,
    flagged,
    handleAnswerSelect,
    handleSubmitAnswer,
    handleNext,
    handlePrev,
    handleToggleFlag,
    toggleQuestionFlag,
    goToQuestion,
    getStats,
    progress: {
      current: currentIndex + 1,
      total: questions.length
    }
  };
};
