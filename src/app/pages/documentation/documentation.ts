import { Component, signal, OnInit } from '@angular/core';
import { Browser } from '@capacitor/browser';

/**
 * npm install @capacitor/browser
 *
 * Usamos Browser.open() en vez de window.open()/target="_blank" porque en
 * web abre una pestaña nueva normal, pero en iOS/Android abre un navegador
 * in-app (SFSafariViewController / Chrome Custom Tabs) en vez de sacar al
 * usuario de la app a su navegador del sistema. Es el equivalente correcto
 * de "abrir en pestaña nueva" que ya usan en Capacitor Share.
 */

interface TeamContact {
  label: string;
  href: string; // mailto:, https://..., etc.
  icon: string; // clase de primeicons, ej. 'pi-envelope'
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  summary: string;
  /** Si existe, la card se expande y muestra este texto dentro de la app */
  content?: string;
  /** Si existe (y no hay `content`), clickear redirige a esta URL externa */
  externalUrl?: string;
}

interface HelplineItem {
  name: string;
  phone: string; // formato para el href tel:, sin espacios
  displayPhone: string; // formato legible
  description: string;
}

// ─────────────────────────────────────────────────────────────
// TODO: reemplaza esto con los datos reales de tu proyecto
// ─────────────────────────────────────────────────────────────
const REPO_URL = 'https://github.com/YalukR/mood-tracker.git';

const TEAM_DESCRIPTION =
  'Este proyecto es de código abierto y lo mantiene un equipo pequeño de desarrolladores independientes.';

const TEAM_CONTACTS: TeamContact[] = [
  { label: 'Ver código en GitHub', href: REPO_URL, icon: 'pi-github' },
  { label: 'Escríbenos', href: 'mailto:yalukramos@gmail.com', icon: 'pi-envelope' },
];

// TODO: reemplaza con artículos/fuentes reales que quieras curar.
// Deja `content` si quieres mostrar el texto dentro de la app, o `externalUrl`
// si quieres que abra la publicación original en el navegador.
const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n1',
    title: 'Cómo identificar señales de ansiedad',
    source: 'Secretaría de Salud',
    summary: 'Guía breve sobre síntomas comunes y cuándo buscar ayuda profesional.',
    externalUrl: 'https://www.gob.mx/salud',
  },
  {
    id: 'n2',
    title: '¿Qué es el registro de emociones y para qué sirve?',
    source: 'Equipo del proyecto',
    summary: 'Por qué llevar un registro diario puede ayudarte a identificar patrones.',
    content:
      'Llevar un registro diario de tus emociones te ayuda a notar patrones a lo largo del tiempo: qué días te sientes mejor, qué situaciones se repiten antes de un bajón de ánimo, y qué tan seguido aparece cada emoción. No reemplaza la terapia, pero es una herramienta útil para llevar información concreta si decides buscar apoyo profesional.',
  },
];

// Verificado con fuentes oficiales (gob.mx/conasama, Secretaría de Salud de
// Michoacán) — revisa periódicamente que sigan vigentes.
const HELPLINES: HelplineItem[] = [
  {
    name: 'Línea de la Vida (CONASAMA)',
    phone: '8009112000',
    displayPhone: '800 911 2000',
    description: 'Salud mental y adicciones, 24/7, todo México.',
  },
  {
    name: 'SAPTEL',
    phone: '5552598121',
    displayPhone: '55 5259 8121',
    description: 'Intervención en crisis emocional, 24/7.',
  },
  {
    name: 'Consejo Ciudadano',
    phone: '5555335533',
    displayPhone: '55 5533 5533',
    description: 'Orientación y contención, 24/7 (tel. y WhatsApp).',
  },
  {
    name: 'Emergencias',
    phone: '911',
    displayPhone: '911',
    description: 'Si tú o alguien más está en peligro inmediato.',
  },
];
// ─────────────────────────────────────────────────────────────

type CardKey = 'project' | 'news' | 'helplines';

@Component({
  selector: 'app-documentation',
  imports: [],
  templateUrl: './documentation.html',
  styleUrl: './documentation.css',
})
export class Documentation implements OnInit {
  /**
   * Orden de las 3 cards, de arriba a abajo. Para intercambiar el Proyecto
   * (arriba) con las Líneas de atención (abajo), como comentaste que tal
   * vez quieras hacer, solo cambia esto a:
   *   ['helplines', 'news', 'project']
   */
  cardOrder: CardKey[] = ['helplines', 'news', 'project'];

  teamDescription = TEAM_DESCRIPTION;
  teamContacts = TEAM_CONTACTS;
  repoUrl = REPO_URL;

  newsItems = NEWS_ITEMS;
  helplines = HELPLINES;

  /** id del item de noticias actualmente expandido (solo uno a la vez) */
  expandedNewsId = signal<string | null>(null);

  /** controla la animación de entrada de las cards al navegar a esta pestaña */
  ready = signal(false);

  ngOnInit(): void {
    // doble rAF: asegura que el navegador pinte el estado inicial (oculto)
    // antes de disparar la transición, si no a veces se salta la animación
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.ready.set(true));
    });
  }

  async openExternal(url: string): Promise<void> {
    await Browser.open({ url });
  }

  onNewsClick(item: NewsItem): void {
    if (item.content) {
      // se expande/colapsa dentro de la app, no navega a ningún lado
      this.expandedNewsId.set(this.expandedNewsId() === item.id ? null : item.id);
      return;
    }
    if (item.externalUrl) {
      this.openExternal(item.externalUrl);
    }
  }

  isExpanded(item: NewsItem): boolean {
    return this.expandedNewsId() === item.id;
  }
}