export const ChoiceButton = ({
  choice,
  isSelected = false,
  isCorrect = false,
  isIncorrect = false,
  isDisabled = false,
  onClick,
  showFeedback = false
}) => {
  let bgColor = 'bg-navy-700 hover:bg-navy-600';
  let borderColor = 'border-navy-600';
  let textColor = 'text-gray-100';

  if (showFeedback) {
    if (isCorrect) {
      bgColor = 'bg-green-600/30 hover:bg-green-600/30';
      borderColor = 'border-green-500';
      textColor = 'text-green-200';
    } else if (isIncorrect && isSelected) {
      bgColor = 'bg-red-600/30 hover:bg-red-600/30';
      borderColor = 'border-red-500';
      textColor = 'text-red-200';
    } else if (isSelected) {
      bgColor = 'bg-navy-600';
      borderColor = 'border-blue-500';
    }
  } else if (isSelected) {
    bgColor = 'bg-blue-600 hover:bg-blue-700';
    borderColor = 'border-blue-500';
    textColor = 'text-white';
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        w-full p-4 mb-3 rounded-lg border-2 transition-all
        ${bgColor} ${borderColor} ${textColor}
        ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        flex items-start gap-4 text-left
      `}
    >
      <div
        className={`
          w-8 h-8 rounded-full border-2 flex-shrink-0 flex items-center justify-center
          ${
            showFeedback && isCorrect
              ? 'border-green-500 bg-green-500/20 text-green-300'
              : showFeedback && isIncorrect && isSelected
              ? 'border-red-500 bg-red-500/20 text-red-300'
              : isSelected
              ? 'border-current bg-blue-600/30'
              : 'border-gray-500'
          }
        `}
      >
        <span className="font-semibold text-sm">{choice.label}</span>
      </div>
      <span className="text-base leading-relaxed flex-1 pt-1">
        {choice.text}
      </span>
      {showFeedback && isCorrect && (
        <span className="text-xl flex-shrink-0 pt-1">✓</span>
      )}
      {showFeedback && isIncorrect && isSelected && (
        <span className="text-xl flex-shrink-0 pt-1">✗</span>
      )}
    </button>
  );
};
