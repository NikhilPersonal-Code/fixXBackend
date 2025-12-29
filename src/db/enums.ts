import { pgEnum } from 'drizzle-orm/pg-core';

/* ===== Enums ===== */
export const userRoleEnum = pgEnum('user_role', ['client', 'fixxer', 'both']);

export const taskStatusEnum = pgEnum('task_status', [
  'draft',
  'posted',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
]);
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];

export const priceTypeEnum = pgEnum('price_type', ['per_hour', 'total']);

export const typeOfTaskEnum = pgEnum('type_of_task', ['remote', 'in_person']);

export const offerStatusEnum = pgEnum('offer_status', [
  'pending',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
]);

export const reviewRatingEnum = pgEnum('review_rating', [
  '1',
  '2',
  '3',
  '4',
  '5',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'new_task',
  'new_offer',
  'offer_accepted',
  'offer_rejected',
  'task_assigned',
  'task_completed',
  'booking_confirmed',
  'message_received',
  'review_received',
  'payment_received',
]);

export const messageStatusEnum = pgEnum('message_status', [
  'sent',
  'delivered',
  'read',
]);

export const transactionTypeEnum = pgEnum('transaction_type', [
  'payment',
  'refund',
  'withdrawal',
  'referral_bonus',
]);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);
