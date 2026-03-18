import { calculateProgressPercentage } from '../../utils/helpers';

export const ProgressBar = ({
  current = 0,
  total = 100,
  height = 'h-2',
  className = '',
  showLabel = true,
  animate = true
}) => {
  const percentage = calculateProgressPercentage(current, total);

  return (
    <div className={className}>
      <div className={`w-full ${height} bg-navy-700 rounded-full overflow-hidden`}>
        <div
          className={`${height} bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300 ${
            animate ? 'ease-out' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 flex justify-between items-center text-xs text-gray-400">
          <span>
            {current} / {total}
          </span>
          <span className="font-semibold text-blue-400">{percentage}%</span>
        </div>
      )}
    </div>
  );
};
