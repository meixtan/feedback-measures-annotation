export const DIMENSION_QUESTIONS = [
    {
      id: "orientation",
      text: "Orientation",
      options: ["Interpretive", "Instructive"],
    },
    {
      id: "function",
      text: "Function",
      options: ["Improvement", "Attainment", "Engagement", "Logistics", "Other"],
    },
    {
      id: "tone",
      text: "Tone",
      options: ["Approving", "Somewhat Approving", "Neutral", "Somewhat Disapproving", "Disapproving"],
    },
    {
        id: "doi",
        text: "Depth of Information",
        options: ["Verification", "Identification", "Elaboration"],
        showIf: (answers) => answers.function === "Improvement" || answers.function === "Attainment"
    },
    {
        id: "dec",
        text: "Degree of Control",
        options: ["Directive", "Somewhat Directive", "Somewhat Facilitative", "Facilitative"],
        showIf: (answers) => answers.function === "Improvement" && answers.doi === "Elaboration"
    },
    {
        id: "content",
        text: "Content Focus",
        options: ["Ideas", "Organization", "Voice", "Word Choice", "Sentence Fluency", "Grammar and Mechanics", "None of These", "It's Unclear"],
    },
    {
        id: "scope",
        text: "Scope of Revision",
        options: ["Words", "Sentences", "Paragraphs"],
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