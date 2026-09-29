import { redirect } from "next/navigation";

export default async function TrilhaSucedidoRepertoirePage({
  params,
}: {
  params: Promise<{ module_id: string; topic_id: string }>;
}) {
  const { module_id, topic_id } = await params;
  redirect(`/mentor/aprender/trilha-sucedido/modulo/${module_id}#topico-${topic_id}`);
}
