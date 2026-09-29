import { getDashboardOverview } from "@/lib/admin/queries";
import { PageHeader, SectionTitle } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/reui/badge";
import { KpiCard } from "./_components/kpi-card";
import { DonutBreakdown } from "./_components/donut-breakdown";
import { UpcomingEventsTable } from "./_components/upcoming-events-table";

export default async function DashboardPage() {
  const overview = await getDashboardOverview();
  const { usersByRole, projectsByStatus } = overview;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral quantitativa da plataforma."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Usuários"
          value={overview.totalUsers}
          sub={
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" size="sm">
                {usersByRole.student} mentorados
              </Badge>
              <Badge variant="secondary" size="sm">
                {usersByRole.mentor} mentores
              </Badge>
            </div>
          }
        />
        <KpiCard label="Famílias" value={overview.totalFamilies} sub="Cadastradas na plataforma" />
        <KpiCard
          label="Projetos ativos"
          value={`${projectsByStatus.active} de ${overview.totalProjects}`}
          sub={
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="warning-light" size="sm">
                {projectsByStatus.paused} pausados
              </Badge>
              <Badge variant="secondary" size="sm">
                {projectsByStatus.completed} concluídos
              </Badge>
            </div>
          }
        />
        <KpiCard
          label="Eventos próximos"
          value={overview.upcomingEventsCount}
          sub="Nos próximos 30 dias"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários por papel</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutBreakdown
              emptyLabel="Nenhum usuário cadastrado ainda."
              slices={[
                {
                  key: "student",
                  label: "Mentorados",
                  value: usersByRole.student,
                  fillClassName: "fill-primary",
                  dotClassName: "bg-primary",
                },
                {
                  key: "mentor",
                  label: "Mentores",
                  value: usersByRole.mentor,
                  fillClassName: "fill-info",
                  dotClassName: "bg-info",
                },
                {
                  key: "admin",
                  label: "Admins",
                  value: usersByRole.admin,
                  fillClassName: "fill-muted-foreground",
                  dotClassName: "bg-muted-foreground",
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projetos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutBreakdown
              emptyLabel="Nenhum projeto cadastrado ainda."
              slices={[
                {
                  key: "active",
                  label: "Ativos",
                  value: projectsByStatus.active,
                  fillClassName: "fill-success",
                  dotClassName: "bg-success",
                },
                {
                  key: "paused",
                  label: "Pausados",
                  value: projectsByStatus.paused,
                  fillClassName: "fill-warning",
                  dotClassName: "bg-warning",
                },
                {
                  key: "completed",
                  label: "Concluídos",
                  value: projectsByStatus.completed,
                  fillClassName: "fill-muted-foreground",
                  dotClassName: "bg-muted-foreground",
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>Próximos eventos do cronograma</SectionTitle>
        <UpcomingEventsTable events={overview.upcomingEvents} />
        <p className="mt-3 text-sm text-muted-foreground">
          {overview.submittedAnswersCount} respostas de exercícios enviadas até agora.
        </p>
      </div>
    </div>
  );
}
