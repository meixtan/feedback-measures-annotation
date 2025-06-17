export const DIMENSION_QUESTIONS = [
    {
      id: "orientation",
      text: "Orientation",
      type: "radio",
      options: ["Interpretive", "Instructive"],
    },
    {
      id: "function",
      text: "Function",
      type: "radio",
      options: ["Improvement", "Attainment", "Engagement", "Logistics", "Other"],
    },
    {
      id: "tone",
      text: "Tone",
      type: "radio",
      options: ["Approving", "Somewhat Approving", "Neutral", "Somewhat Disapproving", "Disapproving"],
    },
    {
        id: "doi",
        text: "Depth of Information",
        type: "radio",
        options: ["Verification", "Identification", "Elaboration"],
        showIf: (answers) => answers.function === "Improvement" || answers.function === "Attainment"
    },
    {
        id: "dec",
        text: "Degree of Control",
        type: "radio",
        options: ["Directive", "Somewhat Directive", "Somewhat Facilitative", "Facilitative"],
        showIf: (answers) => answers.function === "Improvement" && (answers.doi === "Elaboration")
    },
    {
        id: "content",
        text: "Content Focus",
        type: "checkbox",
        options: ["Ideas", "Organization", "Voice", "Word Choice", "Sentence Fluency", "Grammar and Mechanics", "None of These", "It's Unclear"],
    },
    {
        id: "scope",
        text: "Scope of Revision",
        type: "checkbox",
        options: ["Words", "Sentences", "Paragraphs", "Global"],
        showIf: (answers) => answers.function === "Improvement"
    }
  ];

  export const getVisibleQuestionIds = (answers) =>
    DIMENSION_QUESTIONS
      .filter((q) => !q.showIf || q.showIf(answers))
      .map((q) => q.id);
  
  export const hasUnanswered = (answers) => {
    const requiredIds = getVisibleQuestionIds(answers);
    return requiredIds.some((id) => !answers[id]);
  };