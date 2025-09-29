const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Instructor: Create a new module
router.post('/modules', authenticate, authorize('instructor'), courseController.createModule);

// Instructor: Upload assets to a module
router.post(
	'/modules/:id/assets',
	authenticate,
	authorize('instructor'),
	courseController.uploadAssets
);

// Users: Fetch all modules
router.get('/modules', authenticate, courseController.getModules);

// Instructor: Bulk operations
router.delete('/modules/bulk-delete', authenticate, authorize('instructor'), courseController.bulkDeleteCourses);
router.patch('/modules/bulk-archive', authenticate, authorize('instructor'), courseController.bulkArchiveModules);

// Users: Fetch module details and assets
router.get('/modules/:id', authenticate, courseController.getModuleById);

// Instructor: Delete a module
router.delete('/modules/:id', authenticate, authorize('instructor'), courseController.deleteModule);

// Instructor: Update or archive a module
router.patch('/modules/:id', authenticate, authorize('instructor'), courseController.updateModule);

module.exports = router;
