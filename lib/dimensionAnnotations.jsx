import { DIMENSION_QUESTIONS } from "./dimensionQuestions";

const DimensionAnnotations = ({ instance, answers, onAnswersChange }) => {
  const visibleQuestions = DIMENSION_QUESTIONS.filter(
    (q) => !q.showIf || q.showIf(answers)
  );

  const handleChange = (questionId, value) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: value,
    };

    // Only keep answers for visible questions
    const visibleQuestionIds = visibleQuestions.map((q) => q.id);
    const cleanedAnswers = Object.fromEntries(
        Object.entries(updatedAnswers).filter(([key]) =>
            visibleQuestionIds.includes(key)
        )
    );
    
    onAnswersChange(cleanedAnswers);
  };

  return (
    <div className="ml-4 mt-4 bg-white flex flex-wrap gap-6">
      {visibleQuestions.map((q) => (
        <div key={`${q.id}`} className="mb-4">
          <p className="font-medium mb-2">{q.text}</p>
          {q.options.map((option) => (
            <label key={`${option}`} className="block">
              <input
                type="radio"
                name={`${q.id}-${instance}`}
                value={option}
                checked={answers[q.id] === option}
                onChange={() => handleChange(q.id, option)}
                className="mr-2"
              />
              {option}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
};

export default DimensionAnnotations;
