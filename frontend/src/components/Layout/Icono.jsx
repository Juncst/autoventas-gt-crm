const trazos = {
  auto: 'M3 16V9l2-5h14l2 5v7M3 10h18M6 16v3M18 16v3M6 13h2M16 13h2',
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  clientes: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  prospectos: 'M4 4h16v16H4zM8 8h8M8 12h8M8 16h4',
  usuarios: 'M12 3l9 4v5c0 5-9 9-9 9s-9-4-9-9V7zM8 12l3 3 5-6',
  salir: 'M9 21H4V3h5M10 12h11M17 8l4 4-4 4',
};

export default function Icono({ nombre, ...props }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={trazos[nombre] || trazos.auto} /></svg>;
}
