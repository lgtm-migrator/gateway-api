import express from 'express';
import CourseController from './course.controller';
import { courseService } from './dependency';

const router = express.Router();
const courseController = new CourseController(courseService);

// @route   GET /api/v2/courses/id
// @desc    Returns a course based on identifier provided
// @access  Public
router.get('/:id', (req, res) => courseController.getCourse(req, res));

// @route   GET /api/v2/courses
// @desc    Returns a collection of courses based on supplied query parameters
// @access  Public
router.get('/', (req, res) => courseController.getCourses(req, res));

module.exports = router;
