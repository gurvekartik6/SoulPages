// Hex mirrors of the CSS custom properties in index.css. Charting libraries
// (Recharts) set these as raw SVG presentation attributes rather than through
// the stylesheet cascade, and var() resolution for those is inconsistent
// across browsers/versions — so chart code should import these literals
// instead of writing 'var(--color-*)' directly into chart props.
export const THEME = {
  paper: '#EEF0E7',
  paperDim: '#E4E7DC',
  ink: '#1E2B22',
  inkSoft: '#45524A',
  muted: '#6E7669',
  surface: '#FFFFFF',
  line: '#D8DCCE',
  brass: '#C08A28',
  brassDeep: '#9C6D1B',
  ribbon: '#2F6F5A',
  ribbonDeep: '#234F41',
  stampRed: '#B34A3C'
};
