const express = require('express');
const {
  getIncidents,
  getIncidentById,
  acceptIncident,
  startIncidentWork,
  submitIncidentResolution,
  addIncidentProgress,
} = require('../controllers/incidentController');
const {
  createManualIncident,
  updateIncidentPriority,
  restoreIncident,
  assignIncident,
  archiveIncident,
  deleteIncident,
  reviewIncident,
  messageDepartment,
} = require('../controllers/incidentOperationsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadResolutionEvidence, uploadProgressEvidence } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, authorize('super_admin', 'service_provider'), getIncidents);
router.post('/manual', protect, authorize('super_admin'), createManualIncident);
router.get('/:id', protect, authorize('super_admin', 'service_provider'), getIncidentById);

// Super Admin monitors/configures/escalates. These are exception controls, not normal workflow steps.
router.patch('/:id/assign', protect, authorize('super_admin'), assignIncident);
router.patch('/:id/priority', protect, authorize('super_admin'), updateIncidentPriority);
router.patch('/:id/restore', protect, authorize('super_admin'), restoreIncident);
router.patch('/:id/archive', protect, authorize('super_admin'), archiveIncident);
router.delete('/:id', protect, authorize('super_admin'), deleteIncident);
router.post('/:id/message-department', protect, authorize('super_admin'), messageDepartment);

// The responsible department owns the operational workflow.
router.patch('/:id/review', protect, authorize('service_provider'), reviewIncident);
router.patch('/:id/accept', protect, authorize('service_provider'), acceptIncident);
router.patch('/:id/start-work', protect, authorize('service_provider'), startIncidentWork);
router.post(
  '/:id/progress',
  protect,
  authorize('service_provider'),
  uploadProgressEvidence.array('evidence', 5),
  addIncidentProgress
);
router.patch(
  '/:id/resolve',
  protect,
  authorize('service_provider'),
  uploadResolutionEvidence.array('evidence', 5),
  submitIncidentResolution
);

module.exports = router;
