import questionsData from '../data/questions.json';
import { TOPIC_COLORS } from '../constants';

export const getAllQuestions = () => questionsData;

export const getQuestionsByTopic = (topic) => {
  return questionsData.filter((q) => q.topic === topic);
};

export const getRandomQuestions = (count, exclude = []) => {
  const excludeSet = new Set((exclude || []).map((id) => String(id)));
  const unseen = questionsData.filter((q) => !excludeSet.has(String(q.id)));
  const pool = unseen.length > 0 ? unseen : questionsData;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getQuestionsByTopics = (topics, count) => {
  const filtered = questionsData.filter((q) => topics.includes(q.topic));
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getUniqueTopic = () => {
  const topics = new Set(questionsData.map((q) => q.topic));
  return Array.from(topics).sort();
};

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export const formatTimeHM = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const getTopicColor = (topic) => {
  return TOPIC_COLORS[topic] || '#64748b';
};

export const calculateProgressPercentage = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

export const getGradeFromAccuracy = (accuracy) => {
  const acc = parseFloat(accuracy);
  if (acc >= 90) return { grade: 'A', color: 'text-green-500' };
  if (acc >= 80) return { grade: 'B', color: 'text-blue-500' };
  if (acc >= 70) return { grade: 'C', color: 'text-yellow-500' };
  if (acc >= 60) return { grade: 'D', color: 'text-orange-500' };
  return { grade: 'F', color: 'text-red-500' };
};

export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getAnswerChoices = (question) => {
  const choices = [];
  if (question.a) choices.push({ label: 'A', value: 'a', text: question.a });
  if (question.b) choices.push({ label: 'B', value: 'b', text: question.b });
  if (question.c) choices.push({ label: 'C', value: 'c', text: question.c });
  if (question.d) choices.push({ label: 'D', value: 'd', text: question.d });
  if (question.e) choices.push({ label: 'E', value: 'e', text: question.e });
  return choices;
};

export const isCorrectAnswer = (question, choice) => {
  return question.answer && question.answer.toLowerCase() === choice.toLowerCase();
};

export const getCorrectAnswer = (question) => {
  const answer = question.answer?.toLowerCase();
  if (answer === 'a') return { label: 'A', text: question.a };
  if (answer === 'b') return { label: 'B', text: question.b };
  if (answer === 'c') return { label: 'C', text: question.c };
  if (answer === 'd') return { label: 'D', text: question.d };
  if (answer === 'e') return { label: 'E', text: question.e };
  return null;
};

export const searchQuestions = (query) => {
  const lowerQuery = query.toLowerCase();
  return questionsData.filter(
    (q) =>
      q.question.toLowerCase().includes(lowerQuery) ||
      q.a?.toLowerCase().includes(lowerQuery) ||
      q.b?.toLowerCase().includes(lowerQuery) ||
      q.c?.toLowerCase().includes(lowerQuery) ||
      q.d?.toLowerCase().includes(lowerQuery) ||
      q.e?.toLowerCase().includes(lowerQuery) ||
      q.explanation?.toLowerCase().includes(lowerQuery)
  );
};

export const downloadProgress = (progressData, filename = 'peddent-progress.json') => {
  const dataStr = JSON.stringify(progressData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const uploadProgress = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const generateCalendarData = (progressData) => {
  const calendar = {};
  const today = new Date();

  // Get last 365 days
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    calendar[dateStr] = 0;
  }

  // Count study sessions per day
  Object.values(progressData).forEach((q) => {
    if (q.lastSeen) {
      const date = new Date(q.lastSeen).toISOString().split('T')[0];
      if (calendar[date] !== undefined) {
        calendar[date] += 1;
      }
    }
  });

  return calendar;
};

export const getStreakData = (progressData) => {
  const calendar = generateCalendarData(progressData);
  const dates = Object.keys(calendar)
    .sort((a, b) => new Date(b) - new Date(a))
    .filter((date) => calendar[date] > 0);

  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const today = new Date().toISOString().split('T')[0];

  let prevDate = today;
  for (const date of dates) {
    const prev = new Date(prevDate);
    const curr = new Date(date);
    const diffDays = Math.floor((prev - curr) / (1000 * 60 * 60 * 24));

    if (diffDays === 1 || (prevDate === today && diffDays === 0)) {
      tempStreak += 1;
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      tempStreak = 1;
    }

    if (date === today || (new Date(date).toISOString().split('T')[0] === new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0])) {
      currentStreak = tempStreak;
    }

    prevDate = date;
  }

  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }

  return { currentStreak, longestStreak };
};
