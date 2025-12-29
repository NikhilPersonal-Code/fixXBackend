import {
  notifications,
  referrals,
  transactions,
  users,
  otps,
  fixxerProfiles,
  categories,
  tasks,
  taskImages,
  offers,
  bookings,
  reviews,
  messages,
  conversations,
} from '@/db/tables';

// ==================== TYPE EXPORTS ====================
export type User = typeof users.$inferSelect;
export type Otp = typeof otps.$inferSelect;
export type FixxerProfile = typeof fixxerProfiles.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type TaskImage = typeof taskImages.$inferSelect;
export type Offer = typeof offers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
