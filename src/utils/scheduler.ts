import 'dotenv/config';
import 'tsconfig-paths/register';
import db from '@/config/dbConfig';
import { fixxerProfiles } from '@/db/tables';
import { eq, sql } from 'drizzle-orm';
import cron from 'node-cron';
import { DAY_IN_SECONDS } from '@/constants/common';


export const scheduleFixbitIncrement = (fixxerProfileId: string) => {
  const currentDate = new Date();
  const afterNextTwoWeek = new Date(
    currentDate.getTime() + DAY_IN_SECONDS * 14,
  );
  const afterNextTwoWeekDay = afterNextTwoWeek.getDate();
  const afterNextFourWeek = new Date(
    afterNextTwoWeek.getTime() + DAY_IN_SECONDS * 14,
  );
  const afterNextFourWeekDay = afterNextFourWeek.getDate();
  const scheduleTimings = `* * ${afterNextTwoWeekDay},${afterNextFourWeekDay} * *`;
  cron.schedule(scheduleTimings, async () => {
    await db
      .update(fixxerProfiles)
      .set({
        fixBits: sql`${fixxerProfiles.fixBits} + 5`,
      })
      .where(eq(fixxerProfiles.id, fixxerProfileId));
  });
};
