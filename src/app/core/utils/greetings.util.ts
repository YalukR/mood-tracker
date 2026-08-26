export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

const GREETINGS: Record<GreetingPeriod, string[]> = {
  // 05:00 – 11:59
  morning: [
    'Buenos días, {name}',
    '¡Arriba, {name}! Nuevo día',
    'Que tengas una mañana ligera, {name}',
    '{name}, hoy empieza distinto',
    'Un nuevo capítulo, {name}',
    'Café en mano, {name}',
    'Respira hondo, {name}',
    '{name}, ¿cómo despertaste hoy?',
    'La mañana te saluda, {name}',
    'Hora de empezar, {name}',
  ],
  // 12:00 – 17:59
  afternoon: [
    'Buenas tardes, {name}',
    '{name}, ¿cómo va el día?',
    'A mitad del camino, {name}',
    'Un respiro a media tarde, {name}',
    'Hola de nuevo, {name}',
    '{name}, tómate un momento',
    'Sigue fluyendo, {name}',
    'La tarde te acompaña, {name}',
    '¿Todo en orden, {name}?',
    'Un check-in rápido, {name}',
  ],
  // 18:00 – 21:59
  evening: [
    'Buenas noches, {name}',
    '{name}, el día va cerrando',
    'La tarde se despide, {name}',
    'Momento de bajar el ritmo, {name}',
    'Hola otra vez, {name}',
    '¿Cómo cerraste el día, {name}?',
    'Un espacio para ti, {name}',
    'La noche se asoma, {name}',
  ],
  // 22:00 – 04:59
  night: [
    'Hola, {name}, ¿todavía despierto/a?',
    'Silencio y calma, {name}',
    '{name}, un momento antes de dormir',
    'La noche es tuya, {name}',
    'Últimas horas del día, {name}',
    '¿Cómo te sientes ahora, {name}?',
    'Un espacio tranquilo, {name}',
  ],
};

function getPeriod(hour: number): GreetingPeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function getRandomGreeting(name: string, date: Date = new Date()): string {
  const period = getPeriod(date.getHours());
  const pool = GREETINGS[period];
  const template = pool[Math.floor(Math.random() * pool.length)];
  const safeName = name?.trim() || 'de nuevo';
  return template.replace('{name}', safeName);
}