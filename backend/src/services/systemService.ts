import { prisma, withRetry } from '../prisma';
import { AppError } from '../middleware/errorHandler';
const capacityRepo = prisma.capacitySetting;

export const systemService = {
  async getSystemStatus() {
    // Hot path (checked on every order and by the public ordering UI): retry transient errors.
    let status = await withRetry(() => prisma.systemStatus.findFirst({
      orderBy: { id: 'desc' }
    }));

    if (!status) {
      status = await prisma.systemStatus.create({
        data: {}
      });
    }

    // Fetch capacity settings from dedicated table (create default if missing)
    // Guard in case Prisma client wasn't regenerated yet.
    if (capacityRepo) {
      let capacity = await withRetry(() => capacityRepo.findFirst({
        orderBy: { id: 'desc' }
      }));

      if (!capacity) {
        capacity = await capacityRepo.create({
          data: {}
        });
      }

      return {
        ...status,
        dailyLimit: capacity.dailyLimit,
        perHourLimit: capacity.perHourLimit,
        weekendMultiplier: capacity.weekendMultiplier,
        enableAutoPause: capacity.enableAutoPause
      };
    }

    // Fallback to system status fields if capacity table/client not ready yet
    return status;
  },

  async updateSystemStatus(data: {
    orderingPaused?: boolean;
    pauseReason?: string;
    pauseUntil?: Date | string | null;
    capacityLimit?: number;
    currentReservations?: number;
    dailyLimit?: number;
    perHourLimit?: number;
    weekendMultiplier?: number;
    enableAutoPause?: boolean;
  }) {
    let status = await prisma.systemStatus.findFirst({
      orderBy: { id: 'desc' }
    });

    if (!status) {
      status = await prisma.systemStatus.create({
        data: {}
      });
    }

    const sanitizedPauseUntil =
      data.pauseUntil === undefined
        ? undefined
        : data.pauseUntil === null || data.pauseUntil === ''
        ? null
        : new Date(data.pauseUntil);

    // Update ordering fields in system status
    const updatedStatus = await prisma.systemStatus.update({
      where: { id: status.id },
      data: {
        ...(data.orderingPaused !== undefined && { orderingPaused: data.orderingPaused }),
        ...(data.pauseReason !== undefined && { pauseReason: data.pauseReason }),
        ...(sanitizedPauseUntil !== undefined && { pauseUntil: sanitizedPauseUntil }),
        ...(data.capacityLimit !== undefined && { capacityLimit: data.capacityLimit }),
        ...(data.currentReservations !== undefined && { currentReservations: data.currentReservations })
      }
    });

    // Upsert capacity settings in the dedicated table if available
    if (capacityRepo) {
      let capacity = await capacityRepo.findFirst({
        orderBy: { id: 'desc' }
      });

      if (!capacity) {
        capacity = await capacityRepo.create({
          data: {
            dailyLimit: data.dailyLimit ?? 100,
            perHourLimit: data.perHourLimit ?? 25,
            weekendMultiplier: data.weekendMultiplier ?? 1.5,
            enableAutoPause: data.enableAutoPause ?? true
          }
        });
      } else {
        capacity = await capacityRepo.update({
          where: { id: capacity.id },
          data: {
            ...(data.dailyLimit !== undefined && { dailyLimit: data.dailyLimit }),
            ...(data.perHourLimit !== undefined && { perHourLimit: data.perHourLimit }),
            ...(data.weekendMultiplier !== undefined && { weekendMultiplier: data.weekendMultiplier }),
            ...(data.enableAutoPause !== undefined && { enableAutoPause: data.enableAutoPause })
          }
        });
      }

      return {
        ...updatedStatus,
        dailyLimit: capacity.dailyLimit,
        perHourLimit: capacity.perHourLimit,
        weekendMultiplier: capacity.weekendMultiplier,
        enableAutoPause: capacity.enableAutoPause
      };
    }

    // Fallback return if capacityRepo not available yet
    return updatedStatus;
  },

  async getClosedDates() {
    const dates = await withRetry(() => prisma.closedDate.findMany({
      orderBy: {
        date: 'asc'
      },
      take: 2000
    }));

    return dates;
  },

  async createClosedDate(data: {
    date: Date;
    reason: string;
    recurring: boolean;
  }) {
    const closedDate = await prisma.closedDate.create({
      data
    });

    return closedDate;
  },

  async deleteClosedDate(id: number) {
    await prisma.closedDate.delete({
      where: { id }
    });
  }
};
