// Tokens visuais dos controles de filtro (selects, inputs de data, pills de
// aba). Mesma ideia de lib/table-styles.ts: as classes nasceram duplicadas
// entre month-year-select e date-range-select, e o terceiro filtro da página
// seria a terceira cópia — que é quando um ajuste de borda passa a precisar
// ser feito em três lugares e infalivelmente esquece um.

// O `<select>` tem DUAS superfícies, e só uma delas o CSS da página alcança.
//
// A caixa fechada aceita as classes normalmente. A lista que abre é desenhada
// pelo sistema operacional, e ela ignora `bg-black/20` — cor semitransparente
// não serve para um popup nativo, então o Windows cai no branco padrão e
// pinta por cima o `text-primary` (quase branco) da caixa: branco no branco,
// sem contraste nenhum.
//
// São duas correções, e as duas são necessárias:
//
//   [color-scheme:dark]  diz ao SO para desenhar o widget inteiro no tema
//                        escuro — é o que o dateInputClass já fazia, e o que
//                        faltava aqui.
//   [&_option] / [&_optgroup]  dão à lista uma cor OPACA. Sem isso, alguns
//                        navegadores ainda desenham o popup claro mesmo com
//                        color-scheme, e a opção selecionada some.
//
// bg-bg-secondary (#101317) em vez do preto puro do canvas: a lista precisa
// se destacar da página que está atrás dela.
// `bg-black/20` sobre o canvas preto é preto: quem desenhava o controle era
// só a borda de 1px. Fundo OPACO (#101317, o segundo tom de preto da marca)
// mais borda mais forte: o campo passa a se ler como campo, sem clarear a
// página.
export const controlClass =
  "cursor-pointer appearance-none rounded-none border border-hairline-strong bg-bg-secondary py-1.5 pl-3 pr-7 text-[12.5px] font-semibold text-primary outline-none transition-colors duration-200 hover:border-accent-light focus:border-accent-primary [color-scheme:dark] [&_optgroup]:bg-bg-secondary [&_optgroup]:font-bold [&_optgroup]:text-muted [&_option]:bg-bg-secondary [&_option]:font-semibold [&_option]:text-primary";

export const dateInputClass =
  "cursor-pointer rounded-none border border-hairline-strong bg-bg-secondary px-2.5 py-1.5 text-[12.5px] font-semibold text-primary outline-none transition-colors duration-200 hover:border-accent-light focus:border-accent-primary [color-scheme:dark]";

export const chevronBg =
  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")";

/** A seta do `<select>`: `appearance-none` mata a nativa, esta a devolve. */
export const chevronStyle = {
  backgroundImage: chevronBg,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  backgroundSize: "14px",
} as const;

/** Trilho das pills de aba (Fechamentos, Visão). */
export const tabTrackClass = "flex items-center gap-1 rounded-none bg-black/20 p-1";

export function tabClass(active: boolean) {
  return (
    "rounded-none px-3 py-1.5 text-[12.5px] font-bold transition-all duration-200 " +
    (active
      ? "bg-gradient-to-r from-accent-primary to-accent-light text-ink-strong shadow-[0_0_14px_var(--accent-primary-glow)]"
      : "text-secondary hover:text-white")
  );
}

/** O rótulo que nomeia cada grupo de filtro ("Fechamentos", "Visão"). */
export const filterKickerClass = "font-display text-[12px] font-bold uppercase tracking-wider text-accent-primary";
