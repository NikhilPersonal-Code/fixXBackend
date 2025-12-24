// ==== RELATIONS ====

import { relations } from 'drizzle-orm';
import {
  bookings,
  categories,
  conversations,
  fixxerProfiles,
  messages,
  notifications,
  offers,
  referrals,
  reviews,
  taskImages,
  tasks,
  transactions,
  users,
} from './tables';

export const usersRelations = relations(users, ({ one, many }) => ({
  fixxerProfile: one(fixxerProfiles, {
    fields: [users.id],
    references: [fixxerProfiles.userId],
  }),
  clientTasks: many(tasks, { relationName: 'clientTasks' }),
  assignedTasks: many(tasks, { relationName: 'assignedTasks' }),
  offers: many(offers),
  clientBookings: many(bookings, { relationName: 'clientBookings' }),
  fixxerBookings: many(bookings, { relationName: 'fixxerBookings' }),
  reviewsGiven: many(reviews, { relationName: 'reviewsGiven' }),
  reviewsReceived: many(reviews, { relationName: 'reviewsReceived' }),
  sentMessages: many(messages),
  notifications: many(notifications),
  transactions: many(transactions),
  referralsGiven: many(referrals, { relationName: 'referralsGiven' }),
  referralReceived: one(referrals, {
    fields: [users.id],
    references: [referrals.referredUserId],
  }),
}));

export const fixxerProfilesRelations = relations(fixxerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [fixxerProfiles.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  client: one(users, {
    fields: [tasks.clientId],
    references: [users.id],
    relationName: 'clientTasks',
  }),
  assignedFixxer: one(users, {
    fields: [tasks.assignedFixxerId],
    references: [users.id],
    relationName: 'assignedTasks',
  }),
  category: one(categories, {
    fields: [tasks.categoryId],
    references: [categories.id],
  }),
  images: many(taskImages),
  offers: many(offers),
  booking: one(bookings),
  conversations: many(conversations),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  tasks: many(tasks),
}));

export const taskImagesRelations = relations(taskImages, ({ one }) => ({
  task: one(tasks, {
    fields: [taskImages.taskId],
    references: [tasks.id],
  }),
}));

export const offersRelations = relations(offers, ({ one, many }) => ({
  task: one(tasks, {
    fields: [offers.taskId],
    references: [tasks.id],
  }),
  fixxer: one(users, {
    fields: [offers.fixxerId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  task: one(tasks, {
    fields: [bookings.taskId],
    references: [tasks.id],
  }),
  client: one(users, {
    fields: [bookings.clientId],
    references: [users.id],
    relationName: 'clientBookings',
  }),
  fixxer: one(users, {
    fields: [bookings.fixxerId],
    references: [users.id],
    relationName: 'fixxerBookings',
  }),
  offer: one(offers, {
    fields: [bookings.offerId],
    references: [offers.id],
  }),
  review: one(reviews),
  transactions: many(transactions),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
    relationName: 'reviewsGiven',
  }),
  fixxer: one(users, {
    fields: [reviews.fixxerId],
    references: [users.id],
    relationName: 'reviewsReceived',
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    task: one(tasks, {
      fields: [conversations.taskId],
      references: [tasks.id],
    }),
    participant1: one(users, {
      fields: [conversations.participant1Id],
      references: [users.id],
    }),
    participant2: one(users, {
      fields: [conversations.participant2Id],
      references: [users.id],
    }),
    messages: many(messages),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedTask: one(tasks, {
    fields: [notifications.relatedTaskId],
    references: [tasks.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [transactions.bookingId],
    references: [bookings.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referralsGiven',
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
}));
