const QuestionCard = ({ question, index, total }) => {
  return (
    <section className="card question-card">
      <div className="question-meta">
        Question {index + 1} of {total}
      </div>
      <h2>{question.text ?? question.word ?? 'Untitled'}</h2>
    </section>
  )
}

export default QuestionCard
