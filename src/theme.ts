import { Platform } from 'react-native';

export const C = {
  // Ink : brun chaud au lieu de vert forêt — meilleur contraste sur parchemin
  ink:      '#231f17',   // brun quasi-noir   (était #1a2e1a vert foncé)
  ink2:     '#3a2e1e',   // brun foncé surface (était #2d4a2d vert forêt)
  inkMuted: '#6a5e52',   // brun-gris secondaire, 5.5:1 sur paper (était vert #4a6b4a)
  paper:    '#f5f1e8',   // parchemin chaud
  paper2:   '#ede8db',   // parchemin moyen
  paper3:   '#e2ddd0',   // parchemin clair
  accent:   '#c8502a',   // terracotta / rust
  accent2:  '#e8a030',   // ambre
  blue:     '#2a5a8a',   // bleu montagne
  green:    '#2d7a3a',   // vert positif (D+, sauvegardé)
  line:     'rgba(35,31,23,0.18)',
  line2:    'rgba(35,31,23,0.10)',
};

export const FF = {
  display: Platform.OS === 'web' ? "'Fraunces', Georgia, serif" : 'Georgia',
  mono: Platform.OS === 'web' ? "'DM Mono', 'Courier New', monospace" : 'Courier New',
};

export const notebookBg: object =
  Platform.OS === 'web'
    ? ({
        backgroundImage:
          'repeating-linear-gradient(0deg, transparent 23px, rgba(35,31,23,0.06) 24px)',
      } as any)
    : {};

export function injectFonts(): void {
  if (Platform.OS !== 'web') return;
  if (document.getElementById('rando-fonts')) return;
  const link = document.createElement('link');
  link.id = 'rando-fonts';
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,300;1,9..144,600&display=swap';
  document.head.appendChild(link);
}
