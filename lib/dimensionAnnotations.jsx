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
        <div key={`${q.id}`} className="mb-4 ml-4 min-w-[200px]">
          <p className="font-medium mb-2">{q.text}</p>
          {q.options.map((option) => {
            const inputName = `${q.id}-${instance}`;
            const isCheckbox = q.type === "checkbox";

            const checked = isCheckbox
              ? (answers[q.id] || []).includes(option)
              : answers[q.id] === option;

            const handleOptionChange = () => {
              if (isCheckbox) {
                const current = answers[q.id] || [];
                const newValue = current.includes(option)
                  ? current.filter((val) => val !== option)
                  : [...current, option];
                handleChange(q.id, newValue);
              } else {
                handleChange(q.id, option);
              }
            };

            return (
              <label key={option} className="block">
                <input
                  type={isCheckbox ? "checkbox" : "radio"}
                  name={inputName}
                  value={option}
                  checked={checked}
                  onChange={handleOptionChange}
                  className="mr-2 accent-primary"
                />
                {option}
              </label>
            );
          })}
        </div>
      ))}

    </div>
  );
};

export default DimensionAnnotations;
