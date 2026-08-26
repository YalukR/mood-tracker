# Mood Tracker

Una app simple para registrar cómo te sientes. Nada más, nada menos.

## ¿Por qué existe?

La mayoría de las apps para registrar el estado de ánimo recopilan tu información: la suben a un servidor, la analizan, a veces la comparten con terceros. Tu estado de ánimo es información profundamente personal, y creo que debería quedarse así: **privada, local, y bajo tu control**. Si algún día quieres compartirla con tu terapeuta, un amigo o quien sea, esa decisión es tuya — no de una empresa.

Además, esta app parte de una idea simple: **no hay emociones negativas, solo emociones**. No vas a encontrar categorías como "mal día" o "emoción negativa" aquí. Sentir tristeza, enojo o ansiedad no es un fallo a corregir; es información tan válida como sentir alegría o calma.

## Características

- **100% sin conexión** — la app nunca necesita internet para funcionar.
- **Datos privados por diseño** — toda la información vive en tu dispositivo, en una base de datos local. Nada sale de tu teléfono a menos que tú lo decidas explícitamente.
- Registro de emociones, combinaciones de emociones y colores personalizables.
- Calendario y estadísticas de tus registros a lo largo del tiempo.
- Bloqueo de app opcional con contraseña.
- Detalles pequeños para hacer el registro diario menos una tarea y más un momento.

## Stack técnico

- **[Angular](https://angular.dev/)** (standalone components, signals, `OnPush`)
- **[Capacitor](https://capacitorjs.com/)** para empaquetar como APK/app nativa
- **SQLite local** (vía `sql-wasm`) como única fuente de almacenamiento — sin backend, sin API, sin base de datos remota
- **[PrimeNG](https://primeng.org/)** para componentes de UI
- **Tailwind CSS**

## Desarrollo

### Requisitos

- Node.js
- Angular CLI

### Instalación

```bash
git clone https://github.com/YalukR/mood-tracker.git
cd mood-tracker
npm install
```

### Levantar en desarrollo

```bash
ng serve
```

### Generar el APK con Capacitor

```bash
ng build
npx cap sync android
npx cap open android
```

Desde Android Studio puedes compilar y firmar el APK normalmente.

## Estado del proyecto

Este es un proyecto personal que mantengo yo solo, sin fines de lucro. Lo comparto porque creo que este tipo de herramientas debería existir de forma abierta y transparente, no porque busque construir un producto o negocio a partir de él. Si te sirve, úsalo; si quieres modificarlo para tus propias necesidades, la licencia te lo permite.

## Licencia

Este proyecto está licenciado bajo la **[GNU Affero General Public License v3.0](LICENSE)**.

En resumen: puedes usar, estudiar, modificar y compartir este código libremente. Si modificas el proyecto y lo ofreces como un servicio (por ejemplo, corriéndolo en un servidor al que otros acceden), estás obligado a compartir el código fuente de tus modificaciones bajo la misma licencia. Esto existe para asegurar que este proyecto —y cualquier derivado— se mantenga abierto y respetuoso con la privacidad de quien lo use.