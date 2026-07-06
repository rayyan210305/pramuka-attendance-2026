const express = require('express');
const router = express.Router();

const { handleScan } = require('../controllers/scanController');
const eventController = require('../controllers/eventController');
const activityController = require('../controllers/activityController');
const participantController = require('../controllers/participantController');
const attendanceController = require('../controllers/attendanceController');
const reportController = require('../controllers/reportController');

// Scan Endpoint
router.post('/scan', handleScan);

// Events API
router.get('/events', eventController.getAllEvents);
router.get('/events/:id', eventController.getEventById);
router.post('/events', eventController.createEvent);
router.put('/events/:id', eventController.updateEvent);
router.delete('/events/:id', eventController.deleteEvent);

// Activities API
router.get('/activities', activityController.getAllActivities);
router.get('/activities/active', activityController.getActiveActivity);
router.get('/activities/:id', activityController.getActivityById);
router.post('/activities', activityController.createActivity);
router.put('/activities/:id', activityController.updateActivity);
router.post('/activities/:id/activate', activityController.setActiveActivity);
router.delete('/activities/:id', activityController.deleteActivity);

// Participants API
router.get('/participants', participantController.getAllParticipants);
router.get('/participants/:id', participantController.getParticipantById);
router.post('/participants', participantController.createParticipant);
router.put('/participants/:id', participantController.updateParticipant);
router.delete('/participants/:id', participantController.deleteParticipant);

// Attendance API
router.get('/attendance', attendanceController.getAllAttendance);
router.delete('/attendance/:id', attendanceController.deleteAttendance);

// Reports API
router.get('/reports/summary', reportController.getSummaryReport);
router.get('/reports/export', reportController.exportReport);

module.exports = router;
