import { Injectable, inject } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AppSettingsRepository, MoodEntryRepository, EmotionRepository } from '../repositories';

/** IDs fijos: cada tipo de recordatorio reutiliza el mismo id, así cancelarlo/reemplazarlo es directo */
const NOTIFICATION_IDS = {
  MORNING: 5001,
  NO_ENTRY_TODAY: 5002,
  NO_ENTRY_WEEK: 5003,
  FOLLOW_UP_EMOTION: 5004,
  STREAK: 5005,
} as const;

const MORNING_HOUR = 9;
const NO_ENTRY_TODAY_HOUR = 20; // 8pm
const NO_ENTRY_WEEK_HOUR = 18; // domingo 6pm
const FOLLOW_UP_HOURS_AFTER_ENTRY = 4;
/** Si el seguimiento caería después de esta hora, mejor no molestar de noche */
const FOLLOW_UP_LATEST_HOUR = 22;

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function atTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Próxima ocurrencia de una hora del día: hoy si aún no pasa, mañana si ya pasó */
function nextDailyOccurrence(hour: number, minute = 0): Date {
  const now = new Date();
  const today = atTime(now, hour, minute);
  if (today.getTime() > now.getTime()) return today;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return atTime(tomorrow, hour, minute);
}

/** Próximo domingo a una hora dada */
function nextSundayAt(hour: number, minute = 0): Date {
  const now = new Date();
  const daysUntilSunday = (7 - now.getDay()) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
  return atTime(target, hour, minute);
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private appSettingsRepo = inject(AppSettingsRepository);
  private moodEntryRepo = inject(MoodEntryRepository);
  private emotionRepo = inject(EmotionRepository);

  private permissionGranted = false;

  /** Llamar una vez al iniciar la app (en app.ts, ngOnInit) */
  async initialize(): Promise<void> {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      const req = await LocalNotifications.requestPermissions();
      this.permissionGranted = req.display === 'granted';
    } else {
      this.permissionGranted = true;
    }

    if (this.permissionGranted) {
      await this.rescheduleAll();
    }
  }

  /**
   * Recalcula y reprograma los recordatorios "de rutina" (mañana, sin
   * registro hoy, sin registro esta semana). Se debe llamar al abrir la app
   * y al volver de background — así siempre refleja el estado real, y si ya
   * cumpliste la condición, el recordatorio correspondiente simplemente no
   * se reprograma.
   */
  async rescheduleAll(): Promise<void> {
    if (!this.permissionGranted) return;

    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIFICATION_IDS.MORNING },
        { id: NOTIFICATION_IDS.NO_ENTRY_TODAY },
        { id: NOTIFICATION_IDS.NO_ENTRY_WEEK },
      ],
    });

    const name = (await this.appSettingsRepo.getUsername()) ?? 'de nuevo';
    const todayStr = toLocalDateStr(new Date());
    const entriesToday = await this.moodEntryRepo.getByLocalDate(todayStr);
    const hasEntryToday = entriesToday.length > 0;

    // ── Recordatorio de mañana: hábito diario, se reprograma siempre para la próxima ocurrencia ──
    await this.scheduleAt(
      NOTIFICATION_IDS.MORNING,
      `Buenos días, ${name}`,
      '¿Y si empiezas tu día con un registro?',
      nextDailyOccurrence(MORNING_HOUR)
    );

    // ── Sin registro hoy: solo si de verdad no has registrado nada, y solo si la hora aún no pasó ──
    if (!hasEntryToday) {
      const eveningToday = atTime(new Date(), NO_ENTRY_TODAY_HOUR, 0);
      if (eveningToday.getTime() > Date.now()) {
        await this.scheduleAt(
          NOTIFICATION_IDS.NO_ENTRY_TODAY,
          `¿Cómo has estado, ${name}?`,
          'Aún no has hecho ningún registro hoy.',
          eveningToday
        );
      }
    }

    // ── Sin registro en la semana: si no hay ningún registro en los últimos 7 días ──
    const allEntries = await this.moodEntryRepo.getAllEntries();
    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const hasRecentEntry = allEntries.some(e => new Date(e.occurredAt).getTime() >= sevenDaysAgoMs);

    if (!hasRecentEntry) {
      await this.scheduleAt(
        NOTIFICATION_IDS.NO_ENTRY_WEEK,
        `¿Cómo has estado, ${name}?`,
        'Ha pasado una semana sin ningún registro.',
        nextSundayAt(NO_ENTRY_WEEK_HOUR)
      );
    }
  }

  /**
   * Se debe llamar justo después de guardar un registro (en MoodForm.save()).
   * Cancela los recordatorios "sin registro" que ya no aplican, programa el
   * seguimiento de "¿aún te sientes...?" y revisa si se alcanzó una racha.
   */
  async onEntrySaved(emotionIds: number[]): Promise<void> {
    if (!this.permissionGranted) return;

    // Ya registraste algo: el recordatorio "sin registro hoy" ya no aplica
    await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.NO_ENTRY_TODAY }] });

    await this.scheduleFollowUp(emotionIds);
    await this.checkStreak();

    // el de mañana y el semanal se recalculan solos la próxima vez que se abra la app;
    // no hace falta tocarlos aquí.
  }

  private async scheduleFollowUp(emotionIds: number[]): Promise<void> {
    const fireAt = new Date(Date.now() + FOLLOW_UP_HOURS_AFTER_ENTRY * 60 * 60 * 1000);

    // no molestar de noche: si el seguimiento caería muy tarde, mejor no programarlo
    if (fireAt.getHours() >= FOLLOW_UP_LATEST_HOUR || fireAt.getDate() !== new Date().getDate()) {
      await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_IDS.FOLLOW_UP_EMOTION }] });
      return;
    }

    const name = (await this.appSettingsRepo.getUsername()) ?? 'de nuevo';
    const allEmotions = await this.emotionRepo.getAll();
    const selected = allEmotions.filter(e => emotionIds.includes(e.id));

    if (selected.length === 0) return;

    const chosen = selected[Math.floor(Math.random() * selected.length)];

    await this.scheduleAt(
      NOTIFICATION_IDS.FOLLOW_UP_EMOTION,
      `Hola, ${name}`,
      `¿Aún te sientes ${chosen.name.toLowerCase()}?`,
      fireAt
    );
  }

  /**
   * Racha de días consecutivos con al menos un registro, contando desde hoy
   * hacia atrás. Si justo se alcanzó uno de los hitos definidos, manda un
   * refuerzo positivo (no es un recordatorio, es una felicitación).
   */
  private async checkStreak(): Promise<void> {
    const allEntries = await this.moodEntryRepo.getAllEntries();
    const localDates = new Set(allEntries.map(e => toLocalDateStr(new Date(e.occurredAt))));

    let streak = 0;
    const cursor = new Date();
    while (localDates.has(toLocalDateStr(cursor))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    if (!STREAK_MILESTONES.includes(streak)) return;

    const name = (await this.appSettingsRepo.getUsername()) ?? 'de nuevo';

    await this.scheduleAt(
      NOTIFICATION_IDS.STREAK,
      `¡${streak} días seguidos!`,
      `Vas muy bien, ${name}. Sigue así.`,
      new Date(Date.now() + 3000) // casi inmediato, unos segundos después de guardar
    );
  }

  private async scheduleAt(id: number, title: string, body: string, at: Date): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at },
          },
        ],
      });
    } catch (err) {
      console.error(`[Notification] No se pudo programar la notificación ${id}:`, err);
    }
  }
}