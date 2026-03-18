import { getTopicColor } from '../../utils/helpers';

export const TopicBadge = ({ topic, className = '' }) => {
  const color = getTopicColor(topic);

  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: color,
        color: '#ffffff',
        opacity: 0.9
      }}
    >
      {topic}
    </span>
  );
};
