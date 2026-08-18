"use client";

import { useTransition } from "react";
import { dismissReminder, snoozeReminder } from "@/lib/actions/reminder-actions";
import { REMINDER_TYPE_LABEL, type ReminderRow } from "@/lib/services/reminder-service";

export function ReminderItem({ reminder, vehicleId }: { reminder: ReminderRow; vehicleId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium">{reminder.title}</p>
        <p className="text-xs text-neutral-500">
          {REMINDER_TYPE_LABEL[reminder.type] ?? reminder.type}
          {reminder.due_date && ` · ${new Date(reminder.due_date).toLocaleDateString("id-ID")}`}
          {reminder.due_odometer && ` · ${reminder.due_odometer.toLocaleString("id-ID")} km`}
        </p>
      </div>
      <div className="flex gap-2">
        <button disabled={isPending}
          onClick={() => startTransition(() => snoozeReminder(reminder.id, vehicleId, 7))}
          className="text-xs text-neutral-500 px-2 py-1">
          Tunda 7 hari
        </button>
        <button disabled={isPending}
          onClick={() => startTransition(() => dismissReminder(reminder.id, vehicleId))}
          className="text-xs text-red-500 px-2 py-1">
          Selesai
        </button>
      </div>
    </div>
  );
}
