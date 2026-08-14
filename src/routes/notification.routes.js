import express from "express";
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.put("/:id/read", markNotificationAsRead);
router.put("/read-all", markAllNotificationsAsRead);
router.delete("/:id", deleteNotification);

export default router;