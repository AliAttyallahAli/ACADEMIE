/**
 * Calcule le score d'un quiz.
 * @param {Array} questions - [{ id, points, type }]
 * @param {Array} answers - [{ question_id, selected_option_ids: [] }]
 * @param {Map} correctByQuestion - Map<question_id, number[]>
 * @returns {{ scorePercent, earned, total }}
 */
export function calculateScore(questions, answers, correctByQuestion) {
  let earned = 0;
  let total = 0;

  for (const q of questions) {
    total += q.points;
    const answer = answers.find((a) => a.question_id === q.id);
    if (!answer) continue;

    const correctIds = correctByQuestion.get(q.id) || [];
    const selected = answer.selected_option_ids || [];

    if (q.type === 'single') {
      if (selected.length === 1 && correctIds.includes(selected[0])) {
        earned += q.points;
      }
    } else {
      const allCorrect = correctIds.every((id) => selected.includes(id));
      const noWrong = selected.every((id) => correctIds.includes(id));
      if (allCorrect && noWrong) earned += q.points;
    }
  }

  const scorePercent = total > 0 ? (earned / total) * 100 : 0;
  return { scorePercent, earned, total };
}