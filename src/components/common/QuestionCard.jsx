import { Flag, FlaskConical } from 'lucide-react';
import { TopicBadge } from './TopicBadge';

export const QuestionCard = ({
  question,
  onFlagToggle,
  isFlagged = false,
  showNumber = true,
  questionNumber = 1,
  totalQuestions = 1
}) => {
  return (
    <div className="bg-navy-800 rounded-xl p-6 mb-6 shadow-lg border border-navy-700">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {showNumber && (
            <div className="text-sm text-gray-400 mb-2">
              Question {questionNumber} of {totalQuestions}
            </div>
          )}
          <TopicBadge topic={question.topic} className="mb-3" />
        </div>
        {onFlagToggle && (
          <button
            onClick={onFlagToggle}
            className="p-2 rounded-lg hover:bg-navy-700 transition-colors ml-4"
            title={isFlagged ? 'Unflag question' : 'Flag for review'}
          >
            <Flag
              size={20}
              className={isFlagged ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}
            />
          </button>
        )}
      </div>

      {question.case_image_url && (
        <div className="mb-5">
          <img
            src={question.case_image_url}
            alt={question.case_image_desc || 'Clinical case image'}
            className="rounded-lg w-full max-w-md mx-auto block border border-navy-600 shadow"
          />
          {question.case_image_desc && (
            <p className="text-xs text-gray-500 mt-2 text-center italic">{question.case_image_desc}</p>
          )}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-100 mb-6 leading-relaxed">
        {question.question}
      </h3>

      {/* Source attribution hidden intentionally */}
    </div>
  );
};
