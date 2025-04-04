
const express = require('express');
const { check, validationResult } = require('express-validator');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const auth = require('../middlewares/auth');

const router = express.Router();

// @route   GET /api/questions/:examId
// @desc    Get all questions for an exam
// @access  Private
router.get('/:examId', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if educator owns the exam
    if (exam.educator.toString() !== req.educator._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to access these questions' });
    }
    
    const questions = await Question.find({ exam: req.params.examId }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions
// @desc    Create a new question
// @access  Private
router.post(
  '/',
  [
    auth,
    check('exam', 'Exam ID is required').not().isEmpty(),
    check('text', 'Question text is required').not().isEmpty(),
    check('type', 'Question type is required').isIn(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE']),
    check('difficulty', 'Difficulty level is required').isIn(['EASY', 'MEDIUM', 'HARD']),
    check('marks', 'Marks must be a number').isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { exam, text, type, difficulty, marks, options, correctAnswer } = req.body;
      
      // Verify the exam exists and belongs to this educator
      const examDoc = await Exam.findById(exam);
      if (!examDoc) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      
      if (examDoc.educator.toString() !== req.educator._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to add questions to this exam' });
      }
      
      // Validate options for multiple choice questions
      if (type === 'MULTIPLE_CHOICE' && (!options || options.length < 2)) {
        return res.status(400).json({ message: 'Multiple choice questions require at least 2 options' });
      }
      
      // Create question
      const newQuestion = new Question({
        exam,
        text,
        type,
        difficulty,
        marks,
        options: type === 'MULTIPLE_CHOICE' ? options : [],
        correctAnswer: type !== 'MULTIPLE_CHOICE' ? correctAnswer : undefined
      });
      
      await newQuestion.save();
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check exam ownership
    const exam = await Exam.findById(question.exam);
    if (!exam || exam.educator.toString() !== req.educator._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this question' });
    }
    
    await Question.findByIdAndRemove(req.params.id);
    res.json({ message: 'Question removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Check exam ownership
    const exam = await Exam.findById(question.exam);
    if (!exam || exam.educator.toString() !== req.educator._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this question' });
    }
    
    const { text, difficulty, marks, options, correctAnswer } = req.body;
    
    // Update fields
    if (text) question.text = text;
    if (difficulty) question.difficulty = difficulty;
    if (marks) question.marks = marks;
    if (options && question.type === 'MULTIPLE_CHOICE') question.options = options;
    if (correctAnswer && question.type !== 'MULTIPLE_CHOICE') question.correctAnswer = correctAnswer;
    
    await question.save();
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/questions/batch
// @desc    Create multiple questions at once
// @access  Private
router.post('/batch', auth, async (req, res) => {
  try {
    const { examId, questions } = req.body;
    
    if (!examId || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    // Verify the exam exists and belongs to this educator
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    if (exam.educator.toString() !== req.educator._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to add questions to this exam' });
    }
    
    // Prepare the questions to insert
    const questionsToInsert = questions.map(q => ({
      ...q,
      exam: examId
    }));
    
    // Insert the questions
    const insertedQuestions = await Question.insertMany(questionsToInsert);
    
    res.status(201).json(insertedQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
