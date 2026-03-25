<template>
  <div class="tutor-bot" v-if="showAnswer">
    <button @click="toggleExplanation" class="why-button">
      {{ explanationVisible ? '✕ Hide' : '💡 Why?' }}
    </button>
    
    <div v-if="explanationVisible" class="explanation-panel">
      <div v-if="loading" class="loading">
        <p>Generating explanation...</p>
      </div>
      <div v-else-if="explanation" class="explanation-content">
        <p>{{ explanation }}</p>
        <div class="explanation-source">
          {{ isPaid ? '📚 Premium Explanation' : '💡 Free Explanation' }}
        </div>
      </div>
      <div v-else class="error">
        Unable to generate explanation. Try again?
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { generateExplanation } from '../utils/tutorBot';

const props = defineProps({
  question: String,
  userAnswer: String,
  correctAnswer: String,
  showAnswer: Boolean,
  isPaid: { type: Boolean, default: false }
});

const explanationVisible = ref(false);
const explanation = ref('');
const loading = ref(false);

const toggleExplanation = async () => {
  if (explanationVisible.value) {
    explanationVisible.value = false;
  } else {
    explanationVisible.value = true;
    if (!explanation.value) {
      loading.value = true;
      explanation.value = await generateExplanation(
        props.question,
        props.userAnswer,
        props.correctAnswer,
        props.isPaid
      );
      loading.value = false;
    }
  }
};
</script>

<style scoped>
.tutor-bot {
  margin-top: 1rem;
}

.why-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.why-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.explanation-panel {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-left: 4px solid #667eea;
  border-radius: 8px;
}

.loading {
  text-align: center;
  color: #667eea;
  font-style: italic;
}

.explanation-content {
  color: #333;
  line-height: 1.6;
}

.explanation-source {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #999;
  text-align: right;
}

.error {
  color: #e74c3c;
  text-align: center;
}
</style>
