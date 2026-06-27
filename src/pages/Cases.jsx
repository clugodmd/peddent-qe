import { useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { TopicBadge } from '../components/common/TopicBadge';
import { getAllQuestions, getAnswerChoices, getCorrectAnswer } from '../utils/helpers';

const isCaseQuestion = (question) => {
  const haystack = [
    question.topic,
    question.question,
    question.case_image_url,
    question.case_image_desc,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes('case') || Boolean(question.case_image_url);
};

export const Cases = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const caseQuestions = useMemo(() => getAllQuestions().filter(isCaseQuestion), []);

  const filteredQuestions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return caseQuestions;

    return caseQuestions.filter((question) => {
      return [
        question.topic,
        question.question,
        question.a,
        question.b,
        question.c,
        question.d,
        question.e,
        question.explanation,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [caseQuestions, searchTerm]);

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Clinical Cases" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search case questions..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="
              w-full pl-10 pr-4 py-3 rounded-lg
              bg-navy-800 border border-navy-700 focus:border-blue-500
              text-gray-100 placeholder-gray-500 focus:outline-none
            "
          />
        </div>

        <div className="text-sm text-gray-400 mb-6">
          Showing {filteredQuestions.length} of {caseQuestions.length} case questions
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((question) => {
            const isExpanded = expandedId === question.id;
            const choices = getAnswerChoices(question);
            const correctAnswer = getCorrectAnswer(question);

            return (
              <div key={question.id} className="bg-navy-800 rounded-lg border border-navy-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : question.id)}
                  className="w-full p-4 text-left hover:bg-navy-700/50 transition-colors flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <TopicBadge topic={question.topic} />
                    </div>
                    <p className="text-gray-200 font-semibold text-sm leading-snug">
                      Q{question.id}: {question.question}
                    </p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`flex-shrink-0 text-gray-400 transition-transform ${
                      isExpanded ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-navy-700 p-4 bg-navy-900/50">
                    {question.case_image_url && (
                      <div className="mb-5">
                        <img
                          src={question.case_image_url}
                          alt={question.case_image_desc || `Clinical case ${question.id}`}
                          className="max-h-96 w-full object-contain rounded-lg border border-navy-700 bg-navy-950"
                        />
                        {question.case_image_desc && (
                          <p className="text-xs text-gray-400 mt-2">{question.case_image_desc}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 mb-5">
                      {choices.map((choice) => {
                        const isCorrectChoice = correctAnswer?.label === choice.label;
                        return (
                          <div
                            key={choice.label}
                            className={`p-3 rounded-lg text-sm ${
                              isCorrectChoice
                                ? 'bg-green-600/20 border border-green-600/40 text-green-200'
                                : 'bg-navy-800 text-gray-300'
                            }`}
                          >
                            <span className="font-bold mr-2">{choice.label}.</span>
                            {choice.text}
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="p-4 rounded-lg bg-blue-950/40 border border-blue-800/40">
                        <h4 className="text-sm font-semibold text-blue-200 mb-2">Explanation</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
