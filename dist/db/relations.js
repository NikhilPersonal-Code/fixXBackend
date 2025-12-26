"use strict";
// ==== RELATIONS ====
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralsRelations = exports.transactionsRelations = exports.notificationsRelations = exports.messagesRelations = exports.conversationsRelations = exports.reviewsRelations = exports.bookingsRelations = exports.offersRelations = exports.taskImagesRelations = exports.categoriesRelations = exports.tasksRelations = exports.fixxerProfilesRelations = exports.usersRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const tables_1 = require("./tables");
exports.usersRelations = (0, drizzle_orm_1.relations)(tables_1.users, ({ one, many }) => ({
    fixxerProfile: one(tables_1.fixxerProfiles, {
        fields: [tables_1.users.id],
        references: [tables_1.fixxerProfiles.userId],
    }),
    clientTasks: many(tables_1.tasks, { relationName: 'clientTasks' }),
    assignedTasks: many(tables_1.tasks, { relationName: 'assignedTasks' }),
    offers: many(tables_1.offers),
    clientBookings: many(tables_1.bookings, { relationName: 'clientBookings' }),
    fixxerBookings: many(tables_1.bookings, { relationName: 'fixxerBookings' }),
    reviewsGiven: many(tables_1.reviews, { relationName: 'reviewsGiven' }),
    reviewsReceived: many(tables_1.reviews, { relationName: 'reviewsReceived' }),
    sentMessages: many(tables_1.messages),
    notifications: many(tables_1.notifications),
    transactions: many(tables_1.transactions),
    referralsGiven: many(tables_1.referrals, { relationName: 'referralsGiven' }),
    referralReceived: one(tables_1.referrals, {
        fields: [tables_1.users.id],
        references: [tables_1.referrals.referredUserId],
    }),
}));
exports.fixxerProfilesRelations = (0, drizzle_orm_1.relations)(tables_1.fixxerProfiles, ({ one }) => ({
    user: one(tables_1.users, {
        fields: [tables_1.fixxerProfiles.userId],
        references: [tables_1.users.id],
    }),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(tables_1.tasks, ({ one, many }) => ({
    client: one(tables_1.users, {
        fields: [tables_1.tasks.clientId],
        references: [tables_1.users.id],
        relationName: 'clientTasks',
    }),
    assignedFixxer: one(tables_1.users, {
        fields: [tables_1.tasks.assignedFixxerId],
        references: [tables_1.users.id],
        relationName: 'assignedTasks',
    }),
    category: one(tables_1.categories, {
        fields: [tables_1.tasks.categoryId],
        references: [tables_1.categories.id],
    }),
    images: many(tables_1.taskImages),
    offers: many(tables_1.offers),
    booking: one(tables_1.bookings),
    conversations: many(tables_1.conversations),
    notifications: many(tables_1.notifications),
}));
exports.categoriesRelations = (0, drizzle_orm_1.relations)(tables_1.categories, ({ many }) => ({
    tasks: many(tables_1.tasks),
}));
exports.taskImagesRelations = (0, drizzle_orm_1.relations)(tables_1.taskImages, ({ one }) => ({
    task: one(tables_1.tasks, {
        fields: [tables_1.taskImages.taskId],
        references: [tables_1.tasks.id],
    }),
}));
exports.offersRelations = (0, drizzle_orm_1.relations)(tables_1.offers, ({ one, many }) => ({
    task: one(tables_1.tasks, {
        fields: [tables_1.offers.taskId],
        references: [tables_1.tasks.id],
    }),
    fixxer: one(tables_1.users, {
        fields: [tables_1.offers.fixxerId],
        references: [tables_1.users.id],
    }),
    bookings: many(tables_1.bookings),
}));
exports.bookingsRelations = (0, drizzle_orm_1.relations)(tables_1.bookings, ({ one, many }) => ({
    task: one(tables_1.tasks, {
        fields: [tables_1.bookings.taskId],
        references: [tables_1.tasks.id],
    }),
    client: one(tables_1.users, {
        fields: [tables_1.bookings.clientId],
        references: [tables_1.users.id],
        relationName: 'clientBookings',
    }),
    fixxer: one(tables_1.users, {
        fields: [tables_1.bookings.fixxerId],
        references: [tables_1.users.id],
        relationName: 'fixxerBookings',
    }),
    offer: one(tables_1.offers, {
        fields: [tables_1.bookings.offerId],
        references: [tables_1.offers.id],
    }),
    review: one(tables_1.reviews),
    transactions: many(tables_1.transactions),
}));
exports.reviewsRelations = (0, drizzle_orm_1.relations)(tables_1.reviews, ({ one }) => ({
    booking: one(tables_1.bookings, {
        fields: [tables_1.reviews.bookingId],
        references: [tables_1.bookings.id],
    }),
    client: one(tables_1.users, {
        fields: [tables_1.reviews.clientId],
        references: [tables_1.users.id],
        relationName: 'reviewsGiven',
    }),
    fixxer: one(tables_1.users, {
        fields: [tables_1.reviews.fixxerId],
        references: [tables_1.users.id],
        relationName: 'reviewsReceived',
    }),
}));
exports.conversationsRelations = (0, drizzle_orm_1.relations)(tables_1.conversations, ({ one, many }) => ({
    task: one(tables_1.tasks, {
        fields: [tables_1.conversations.taskId],
        references: [tables_1.tasks.id],
    }),
    participant1: one(tables_1.users, {
        fields: [tables_1.conversations.participant1Id],
        references: [tables_1.users.id],
    }),
    participant2: one(tables_1.users, {
        fields: [tables_1.conversations.participant2Id],
        references: [tables_1.users.id],
    }),
    messages: many(tables_1.messages),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(tables_1.messages, ({ one }) => ({
    conversation: one(tables_1.conversations, {
        fields: [tables_1.messages.conversationId],
        references: [tables_1.conversations.id],
    }),
    sender: one(tables_1.users, {
        fields: [tables_1.messages.senderId],
        references: [tables_1.users.id],
    }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(tables_1.notifications, ({ one }) => ({
    user: one(tables_1.users, {
        fields: [tables_1.notifications.userId],
        references: [tables_1.users.id],
    }),
    relatedTask: one(tables_1.tasks, {
        fields: [tables_1.notifications.relatedTaskId],
        references: [tables_1.tasks.id],
    }),
    relatedUser: one(tables_1.users, {
        fields: [tables_1.notifications.relatedUserId],
        references: [tables_1.users.id],
    }),
}));
exports.transactionsRelations = (0, drizzle_orm_1.relations)(tables_1.transactions, ({ one }) => ({
    user: one(tables_1.users, {
        fields: [tables_1.transactions.userId],
        references: [tables_1.users.id],
    }),
    booking: one(tables_1.bookings, {
        fields: [tables_1.transactions.bookingId],
        references: [tables_1.bookings.id],
    }),
}));
exports.referralsRelations = (0, drizzle_orm_1.relations)(tables_1.referrals, ({ one }) => ({
    referrer: one(tables_1.users, {
        fields: [tables_1.referrals.referrerId],
        references: [tables_1.users.id],
        relationName: 'referralsGiven',
    }),
    referredUser: one(tables_1.users, {
        fields: [tables_1.referrals.referredUserId],
        references: [tables_1.users.id],
    }),
}));
