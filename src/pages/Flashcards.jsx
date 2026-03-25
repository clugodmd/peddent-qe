import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { TopicBadge } from '../components/common/TopicBadge';
import { useProgressStore } from '../store/progressStore';
import { getRandomQuestions, getUniqueTopic } from '../utils/helpers';
import { RATING_OPTIONS } from '../constants';

export const Flashcards = () => {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [topics, setTopics] = useState([]);
  const [started, setStarted] = useState(false);
  const recordAttempt = useProgressStore((state) => state.recordAttempt);

  useEffect(() => {
    setTopics(getUniqueTopic());
  }, []);

  const startFlashcards = () => {
    const topicQuestions = selectedTopic === 'all'
      ? getRandomQuestions(30)
      : getRandomQuestions(30).filter((q) => q.topic === selectedTopic);

    setCards(topicQuestions.length > 0 ? topicQuestions : getRandomQuestions(30));
    setCurrentIndex(0);
    setIsFlipped(false);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-navy-900 pb-32">
        <Header title="Flashcards" />

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-navy-800 rounded-xl p-6 border border-navy-700">
            <h2 className="text-xl font-bold text-gray-100 mb-6">Start Flashcard Session</h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Select Topic:
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

            <Button
              onClick={startFlashcards}
              variant="primary"
              size="lg"
              className="w-full"
            >
              Start Flashcards (30 Cards)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-navy-900 pb-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No cards available</p>
          <Button onClick={() => setStarted(false)} variant="primary">
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Flashcard Mode" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-sm font-semibold text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="
            relative w-full h-80 mb-8 cursor-pointer
            perspective transition-transform duration-300
            hover:scale-105
          "
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div
            className="
              absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600
              rounded-xl p-8 flex flex-col justify-between
              shadow-lg border border-blue-500
            "
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden'
            }}
          >
            <div>
              <TopicBadge topic={card.topic} />
              <div className="text-xs text-gray-400 mt-4 mb-2">QUESTION</div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white leading-relaxed">
                {card.question}
              </h3>
            </div>
            <div className="text-sm text-blue-100">Click to reveal answer</div>
          </div>

          {/* Back */}
          <div
            className="
              absolute inset-0 bg-gradient-to-br from-green-600 to-emerald-600
              rounded-xl p-8 flex flex-col justify-between
              shadow-lg border border-green-500
            "
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="text-xs text-gray-100 mb-4">ANSWER</div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold text-white leading-relaxed">
                {card[card.answer?.toLowerCase()]}
              </div>
            </div>
            {card.explanation && (
              <div className="text-sm text-white/80 mt-4 border-t border-white/20 pt-4 leading-relaxed">
                {card.explanation}
              </div>
            )}
            {card.source_url && (
              <div className="mt-3 pt-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Reference: 2025 AAPD Reference Manual
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {RATING_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => {
                  recordAttempt(card.id, ['good', 'easy'].includes(option.value));
                  setIsFlipped(false);
                  if (currentIndex < cards.length - 1) {
                    setCurrentIndex(currentIndex + 1);
                  } else {
                    alert('Flashcard session complete!');
                    setStarted(false);
                  }
                }}
                variant={
                  option.value === 'easy'
                    ? 'success'
                    : option.value === 'good'
                    ? 'primary'
                    : option.value === 'hard'
                    ? 'outline'
                    : 'danger'
                }
                size="md"
                className="flex items-center justify-center gap-2"
              >
                <span>{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentIndex === 0}
            variant="secondary"
            size="lg"
            className="flex items-center gap-2 flex-1"
          >
            <ChevronLeft size={20} />
            Previous
          </Button>

          <Button
            onClick={() => {
              setIsFlipped(false);
              setCurrentIndex(currentIndex);
            }}
            variant="secondary"
            size="lg"
            className="flex items-center justify-center gap-2"
          >
            <RotateCcw size={20} />
          </Button>

          <Button
            onClick={() => {
              if (currentIndex < cards.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
              }
            }}
            disabled={currentIndex === cards.length - 1}
            variant="secondary"
            size="lg"
            className="flex items-center gap-2 flex-1"
          >
            Next
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
