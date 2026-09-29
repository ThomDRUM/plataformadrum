/**
 * Backdrop dos dialogs e sheets do admin: escurece e desfoca o fundo.
 *
 * Vive numa constante porque é passado caso a caso via `overlayClassName` em
 * vez de virar o default do `DialogContent`/`SheetContent` — o sidebar mobile
 * também usa `SheetContent` e não quer esse tratamento.
 */
export const ADMIN_OVERLAY = "bg-black/20 supports-backdrop-filter:backdrop-blur-md";
