import { create } from 'zustand';

const STORAGE_KEY = 'peddent_progress';
const SETTINGS_KEY = 'peddent_settings';

const defaultSettings = {
  darkMode: true,
  fontSize: 'normal',
  soundEnabled: false,
  notificationsEnabled: true
};

const loadProgressFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to load progress:', e);
    return {};
  }
};

const loadSettingsFromStorage = () => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return defaultSettings;
  }
};

const saveToStorage = (data, key) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
};

export const useProgressStore = create((set, get) => {
  const initialProgress = loadProgressFromStorage();
  const initialSettings = loadSettingsFromStorage();

  return {
    // Progress state
    progress: initialProgress,
    settings: initialSettings,

    // Progress methods
    getQuestionProgress: (questionId) => {
      const state = get();
      return state.progress[questionId] || {
        attempts: 0,
        correct: 0,
        lastSeen: null,
        flagged: false,
        notes: '',
        nextReview: null,
        easeFactor: 2.5,
        interval: 1
      };
    },

    recordAttempt: (questionId, isCorrect, timeSpent = 0) => {
      set((state) => {
        const current = state.progress[questionId] || {
          attempts: 0,
          correct: 0,
          lastSeen: null,
          flagged: false,
          notes: '',
          nextReview: null,
          easeFactor: 2.5,
          interval: 1
        };

        const updated = {
          ...current,
          attempts: current.attempts + 1,
          correct: isCorrect ? current.correct + 1 : current.correct,
          lastSeen: Date.now(),
          timeSpent: (current.timeSpent || 0) + timeSpent,
          ...calculateNextReview(current, isCorrect)
        };

        const newProgress = { ...state.progress, [questionId]: updated };
        saveToStorage(newProgress, STORAGE_KEY);
        return { progress: newProgress };
      });
    },

    toggleFlag: (questionId) => {
      set((state) => {
        const current = state.progress[questionId] || {
          attempts: 0,
          correct: 0,
          lastSeen: null,
          flagged: false,
          notes: '',
          nextReview: null,
          easeFactor: 2.5,
          interval: 1
        };

        const updated = { ...current, flagged: !current.flagged };
        const newProgress = { ...state.progress, [questionId]: updated };
        saveToStorage(newProgress, STORAGE_KEY);
        return { progress: newProgress };
      });
    },

    addNote: (questionId, note) => {
      set((state) => {
        const current = state.progress[questionId] || {
          attempts: 0,
          correct: 0,
          lastSeen: null,
          flagged: false,
          notes: '',
          nextReview: null,
          easeFactor: 2.5,
          interval: 1
        };

        const updated = { ...current, notes: note };
        const newProgress = { ...state.progress, [questionId]: updated };
        saveToStorage(newProgress, STORAGE_KEY);
        return { progress: newProgress };
      });
    },

    resetAllProgress: () => {
      set({ progress: {} });
      saveToStorage({}, STORAGE_KEY);
    },

    // Settings methods
    updateSettings: (newSettings) => {
      set((state) => {
        const updated = { ...state.settings, ...newSettings };
        saveToStorage(updated, SETTINGS_KEY);
        return { settings: updated };
      });
    },

    toggleDarkMode: () => {
      set((state) => {
        const updated = { ...state.settings, darkMode: !state.settings.darkMode };
        saveToStorage(updated, SETTINGS_KEY);
        return { settings: updated };
      });
    },

    setFontSize: (size) => {
      set((state) => {
        const updated = { ...state.settings, fontSize: size };
        saveToStorage(updated, SETTINGS_KEY);
        return { settings: updated };
      });
    },

    // Analytics
    getStatistics: () => {
      const state = get();
      const progress = state.progress;
      let totalAttempted = 0;
      let totalCorrect = 0;
      const topicStats = {};

      Object.values(progress).forEach((item) => {
        if (item.attempts > 0) {
          totalAttempted += item.attempts;
          totalCorrect += item.correct;
        }
      });

      return {
        totalQuestions: Object.keys(progress).length,
        totalAttempted,
        totalCorrect,
        accuracy: totalAttempted > 0 ? ((totalCorrect / totalAttempted) * 100).toFixed(1) : 0,
        topicStats
      };
    },

    getTopicStats: (allQuestions) => {
      const state = get();
      const progress = state.progress;
      const topicMap = {};

      allQuestions.forEach((q) => {
        if (!topicMap[q.topic]) {
          topicMap[q.topic] = { correct: 0, attempts: 0, total: 0 };
        }
        topicMap[q.topic].total += 1;

        const qProgress = progress[q.id];
        if (qProgress) {
          topicMap[q.topic].attempts += qProgress.attempts;
          topicMap[q.topic].correct += qProgress.correct;
        }
      });

      return Object.entries(topicMap).map(([topic, stats]) => ({
        topic,
        accuracy: stats.attempts > 0 ? ((stats.correct / stats.attempts) * 100).toFixed(1) : 0,
        attempted: stats.attempts,
        total: stats.total,
        remaining: stats.total - (stats.attempts > 0 ? 1 : 0)
      }));
    },

    getFlaggedQuestions: () => {
      const state = get();
      return Object.entries(state.progress)
        .filter(([, progress]) => progress.flagged)
        .map(([id]) => parseInt(id));
    },

    getUnattemptedQuestions: (allQuestions) => {
      const state = get();
      return allQuestions
        .filter((q) => !state.progress[q.id] || state.progress[q.id].attempts === 0)
        .map((q) => q.id);
    },

    getIncorrectQuestions: (allQuestions) => {
      const state = get();
      return allQuestions
        .filter((q) => {
          const prog = state.progress[q.id];
          return prog && prog.attempts > prog.correct;
        })
        .map((q) => q.id);
    }
  };
});

// SM-2 Spaced Repetition Algorithm
const calculateNextReview = (current, isCorrect) => {
  let easeFactor = current.easeFactor || 2.5;
  let interval = current.interval || 1;

  if (isCorrect) {
    if (current.attempts === 1) {
      interval = 1;
    } else if (current.attempts === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.max(1.3, easeFactor + 0.1);
  } else {
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    easeFactor,
    interval,
    nextReview
  };
};
