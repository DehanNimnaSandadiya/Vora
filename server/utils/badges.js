import User from '../models/User.js';
import StudySession from '../models/StudySession.js';
import Task from '../models/Task.js';
import { logger } from './logger.js';

const BADGES = {
  FIRST_SESSION: 'first_session',
  STREAK_3: 'streak_3',
  TASK_FINISHER: 'task_finisher',
  FOCUSED_5H: 'focused_5h',
};

export async function checkAndAwardBadges(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const earnedBadges = new Set(user.badges || []);
    let newBadges = [];

    // Check First Session
    if (!earnedBadges.has(BADGES.FIRST_SESSION)) {
      const sessionCount = await StudySession.countDocuments({ userId, mode: 'focus' });
      if (sessionCount >= 1) {
        earnedBadges.add(BADGES.FIRST_SESSION);
        newBadges.push(BADGES.FIRST_SESSION);
      }
    }

    // Check Streak 3
    if (!earnedBadges.has(BADGES.STREAK_3)) {
      if (user.stats.streakCount >= 3) {
        earnedBadges.add(BADGES.STREAK_3);
        newBadges.push(BADGES.STREAK_3);
      }
    }

    // Check Task Finisher (10 completed tasks)
    if (!earnedBadges.has(BADGES.TASK_FINISHER)) {
      const completedTasks = await Task.countDocuments({
        userId,
        status: 'completed',
      });
      if (completedTasks >= 10) {
        earnedBadges.add(BADGES.TASK_FINISHER);
        newBadges.push(BADGES.TASK_FINISHER);
      }
    }

    // Check Focused 5h (5 hours total)
    if (!earnedBadges.has(BADGES.FOCUSED_5H)) {
      const totalMinutes = user.stats.totalFocusMinutes || 0;
      if (totalMinutes >= 300) {
        earnedBadges.add(BADGES.FOCUSED_5H);
        newBadges.push(BADGES.FOCUSED_5H);
      }
    }

    if (newBadges.length > 0) {
      user.badges = Array.from(earnedBadges);
      await user.save();
      logger.info(`Awarded badges to user ${userId}: ${newBadges.join(', ')}`);
      return newBadges;
    }

    return [];
  } catch (error) {
    logger.error('Error checking badges:', error);
    return [];
  }
}

export { BADGES };
