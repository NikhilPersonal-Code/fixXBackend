"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionStatusEnum = exports.transactionTypeEnum = exports.messageStatusEnum = exports.notificationTypeEnum = exports.reviewRatingEnum = exports.bookingStatusEnum = exports.offerStatusEnum = exports.typeOfTaskEnum = exports.priceTypeEnum = exports.taskStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
/* ===== Enums ===== */
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['client', 'fixxer', 'both']);
exports.taskStatusEnum = (0, pg_core_1.pgEnum)('task_status', [
    'draft',
    'posted',
    'assigned',
    'in_progress',
    'completed',
    'cancelled',
]);
exports.priceTypeEnum = (0, pg_core_1.pgEnum)('price_type', ['per_hour', 'total']);
exports.typeOfTaskEnum = (0, pg_core_1.pgEnum)('type_of_task', ['remote', 'in_person']);
exports.offerStatusEnum = (0, pg_core_1.pgEnum)('offer_status', [
    'pending',
    'accepted',
    'rejected',
    'withdrawn',
]);
exports.bookingStatusEnum = (0, pg_core_1.pgEnum)('booking_status', [
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
]);
exports.reviewRatingEnum = (0, pg_core_1.pgEnum)('review_rating', [
    '1',
    '2',
    '3',
    '4',
    '5',
]);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', [
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
exports.messageStatusEnum = (0, pg_core_1.pgEnum)('message_status', [
    'sent',
    'delivered',
    'read',
]);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)('transaction_type', [
    'payment',
    'refund',
    'withdrawal',
    'referral_bonus',
]);
exports.transactionStatusEnum = (0, pg_core_1.pgEnum)('transaction_status', [
    'pending',
    'completed',
    'failed',
    'refunded',
]);
