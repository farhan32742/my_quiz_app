import cron from 'node-cron';
// CORRECTED PATH: Go up one level from 'cron/' to the project root,
// then go down into 'server/config/db.js'.
import db from '../server/config/db.js'; 

/**
 * This function runs periodically to update quiz statuses.
 */
const updateQuizStatuses = () => {
  const toActiveSql = `
    UPDATE quizzes 
    SET status = 'active' 
    WHERE status = 'draft' AND NOW() >= CONCAT(exam_date, ' ', exam_time);
  `;

  db.query(toActiveSql, (err, result) => {
    if (err) {
      console.error("[Cron Job] Error updating status from draft to active:", err);
    } else if (result.affectedRows > 0) {
      console.log(`[Cron Job] Activated ${result.affectedRows} quizzes.`);
    }
  });

  const toCompleteSql = `
    UPDATE quizzes 
    SET status = 'complete' 
    WHERE status = 'active' AND NOW() >= TIMESTAMPADD(MINUTE, time_allowed, CONCAT(exam_date, ' ', exam_time));
  `;

  db.query(toCompleteSql, (err, result) => {
    if (err) {
      console.error("[Cron Job] Error updating status from active to complete:", err);
    } else if (result.affectedRows > 0) {
      console.log(`[Cron Job] Completed ${result.affectedRows} quizzes.`);
    }
  });
};

export const startStatusUpdater = () => {
  cron.schedule('* * * * *', () => {
    console.log('[Cron Job] Checking for quiz status updates...');
    updateQuizStatuses();
  });
  console.log('Quiz status updater scheduled to run every minute.');
};