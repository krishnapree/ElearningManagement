import React, { useState } from 'react'
import { Question } from '../types'

interface QuizCardProps {
  question: Question
  onAnswer: (questionId: number, isCorrect: boolean) => void
}

const QuizCard: React.FC<QuizCardProps> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleAnswerSelect = (option: string) => {
    if (showResult) return
    
    setSelectedAnswer(option)
    const isCorrect = option === question.correct_answer
    setShowResult(true)
    
    // Delay the callback to show the result briefly
    setTimeout(() => {
      onAnswer(question.id, isCorrect)
    }, 1500)
  }

  const getOptionClass = (option: string) => {
    if (!showResult) {
      return selectedAnswer === option 
        ? 'bg-primary-100 border-primary-500 text-primary-700'
        : 'bg-white border-gray-300 hover:bg-gray-50'
    }

    if (option === question.correct_answer) {
      return 'bg-green-100 border-green-500 text-green-700'
    }

    if (option === selectedAnswer && option !== question.correct_answer) {
      return 'bg-red-100 border-red-500 text-red-700'
    }

    return 'bg-gray-100 border-gray-300 text-gray-500'
  }

  const getOptionIcon = (option: string) => {
    if (!showResult) return null

    if (option === question.correct_answer) {
      return <i className="fas fa-check text-green-600"></i>
    }

    if (option === selectedAnswer && option !== question.correct_answer) {
      return <i className="fas fa-times text-red-600"></i>
    }

    return null
  }

  return (
    <div className="card animate-slide-up">
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs font-medium text-primary-600 bg-primary-100 px-2 py-1 rounded">
                {question.topic}
              </span>
            </div>
            <h3 className="card-title text-lg">{question.question_text}</h3>
          </div>
          <div className="text-right">
            <i className="fas fa-question-circle text-primary-500 text-xl"></i>
          </div>
        </div>
      </div>

      <div className="card-content">
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 flex items-center justify-between ${getOptionClass(option)} ${
                showResult ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="font-medium">{option}</span>
              {getOptionIcon(option)}
            </button>
          ))}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg animate-fade-in">
            <div className="flex items-center space-x-2 mb-2">
              {selectedAnswer === question.correct_answer ? (
                <>
                  <i className="fas fa-check-circle text-green-600"></i>
                  <span className="font-medium text-green-700">Correct!</span>
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle text-red-600"></i>
                  <span className="font-medium text-red-700">Incorrect</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-600">
              The correct answer is: <strong>{question.correct_answer}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default QuizCard
