import { PROJECT_STATUS_LABEL } from "@/lib/admin/types";
import { Badge } from "@/components/reui/badge";

/**
 * Estado da conta de acesso. `null` é "não deu para consultar o Auth" — mostrar
 * um traço é mais honesto que afirmar "Ativo" (ver `fetchActiveByUserId`).
 */
export function AccountStatusBadge({ isActive }: { isActive: boolean | null }) {
  if (isActive === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return isActive ? (
    <Badge variant="success-light" size="sm">
      Ativo
    </Badge>
  ) : (
    <Badge variant="destructive-light" size="sm">
      Desativado
    </Badge>
  );
}

/**
 * Estado do projeto da família. Sem projeto a família não recebe mentorado nem
 * mentor, então esse caso ganha o mesmo peso visual de um problema.
 */
export function ProjectStatusBadge({ status }: { status: string | undefined }) {
  if (!status) {
    return (
      <Badge variant="destructive-light" size="sm">
        Sem projeto
      </Badge>
    );
  }

  const label = PROJECT_STATUS_LABEL[status] ?? status;

  if (status === "active") {
    return (
      <Badge variant="success-light" size="sm">
        {label}
      </Badge>
    );
  }

  if (status === "paused") {
    return (
      <Badge variant="warning-light" size="sm">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" size="sm">
      {label}
    </Badge>
  );
}

/**
 * Composição da formação. Formação sem módulo é um problema — quem a recebe
 * entra na plataforma e não encontra nada para estudar —, então ganha o mesmo
 * peso visual de uma família sem projeto.
 */
export function TrailModulesBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge variant="destructive-light" size="sm">
        Sem módulos
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" size="sm">
      {count} {count === 1 ? "módulo" : "módulos"}
    </Badge>
  );
}

/**
 * Conteúdo do módulo. Módulo sem tópico não tem nada para ler nem responder,
 * então recebe o mesmo peso visual de uma formação sem módulos.
 */
export function ModuleTopicsBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge variant="destructive-light" size="sm">
        Sem tópicos
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" size="sm">
      {count} {count === 1 ? "tópico" : "tópicos"}
    </Badge>
  );
}

/**
 * Uso do módulo nas formações. Fora de toda formação, ninguém o vê — é um
 * estado a resolver, mas não um defeito do módulo em si, por isso aviso e não
 * erro.
 */
export function ModuleUsageBadge({ trailTitles }: { trailTitles: string[] }) {
  if (trailTitles.length === 0) {
    return (
      <Badge variant="warning-light" size="sm">
        Fora de formações
      </Badge>
    );
  }

  return <span className="text-muted-foreground">{trailTitles.join(", ")}</span>;
}
