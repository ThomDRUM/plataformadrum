import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/components/admin/page-header";

interface Props {
  label: string;
  value: string | number;
  sub?: React.ReactNode;
}

export function KpiCard({ label, value, sub }: Props) {
  return (
    <Card>
      <CardHeader>
        <SectionTitle>{label}</SectionTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
        {sub && <div className="mt-2">{sub}</div>}
      </CardContent>
    </Card>
  );
}
