"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Scrollspy } from "@/components/reui/scrollspy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { updateOwnProfile, updateOwnPassword } from "@/lib/actions/settings";

const NAV = [
  { id: "perfil", label: "Perfil" },
  { id: "seguranca", label: "Segurança" },
  { id: "notificacoes", label: "Notificações" },
];

interface Props {
  fullName: string;
  email: string | null;
}

export function SettingsContent({ fullName, email }: Props) {
  const targetRef = useRef<Document | null>(
    typeof document !== "undefined" ? document : null
  );

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie seus dados pessoais, segurança e preferências de notificação.
      </p>

      <div className="mt-8 flex flex-col gap-8 md:flex-row md:gap-10">
        <div className="shrink-0 md:w-[180px]">
          <Scrollspy
            offset={96}
            targetRef={targetRef}
            className="flex gap-1 overflow-x-auto md:sticky md:top-10 md:flex-col md:overflow-visible"
          >
            {NAV.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                data-scrollspy-anchor={item.id}
                className="shrink-0 justify-start text-muted-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground"
              >
                {item.label}
              </Button>
            ))}
          </Scrollspy>
        </div>

        <div className="min-w-0 max-w-2xl flex-1 space-y-8">
          <section id="perfil">
            <PerfilSection fullName={fullName} email={email} />
          </section>
          <section id="seguranca">
            <SegurancaSection />
          </section>
          <section id="notificacoes">
            <NotificacoesSection />
          </section>
        </div>
      </div>
    </div>
  );
}

function PerfilSection({ fullName, email }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDirty, setIsDirty] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newFullName = String(form.get("full_name") ?? "").trim();

    startTransition(async () => {
      const result = await updateOwnProfile(newFullName);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Perfil atualizado.");
      setIsDirty(false);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Seus dados pessoais na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit}
          onChange={(e) =>
            setIsDirty(
              String(new FormData(e.currentTarget).get("full_name") ?? "").trim() !== fullName
            )
          }
          className="space-y-4"
        >
          {email && (
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <FieldContent>
                <Input id="email" defaultValue={email} disabled />
                <FieldDescription>
                  O e-mail de acesso não pode ser alterado por aqui.
                </FieldDescription>
              </FieldContent>
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="full_name">Nome completo</FieldLabel>
            <Input id="full_name" name="full_name" defaultValue={fullName} required minLength={2} />
          </Field>

          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? "Salvando…" : "Salvar perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SegurancaSection() {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = password.length >= 6 && password === confirmPassword;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    startTransition(async () => {
      const result = await updateOwnPassword(password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Senha alterada.");
      setPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Altere a senha usada para entrar na plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="new_password">Nova senha</FieldLabel>
            <Input
              id="new_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirm_password">Confirmar nova senha</FieldLabel>
            <FieldContent>
              <Input
                id="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-invalid={mismatch}
              />
              {mismatch && <FieldDescription>As senhas não coincidem.</FieldDescription>}
            </FieldContent>
          </Field>

          <Button type="submit" disabled={isPending || !canSubmit}>
            {isPending ? "Alterando…" : "Alterar senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

const NOTIFICATION_PREFS = [
  {
    key: "schedule_reminders",
    label: "Lembretes de reuniões e cronograma",
    description: "Avisos por e-mail sobre próximos compromissos do projeto.",
  },
  {
    key: "platform_news",
    label: "Novidades da plataforma DRUM",
    description: "Atualizações de conteúdo e funcionalidades.",
  },
] as const;

type NotificationKey = (typeof NOTIFICATION_PREFS)[number]["key"];
type NotificationPrefs = Record<NotificationKey, boolean>;

const NOTIFICATION_PREFS_STORAGE_KEY = "drum:notification-prefs";

const DEFAULT_PREFS: NotificationPrefs = Object.fromEntries(
  NOTIFICATION_PREFS.map((item) => [item.key, true])
) as NotificationPrefs;

/**
 * `cachedPrefs` guarda a última leitura para que `getSnapshot` devolva a
 * mesma referência entre chamadas — `useSyncExternalStore` re-renderiza em
 * loop se o snapshot mudar de identidade sem o store ter mudado de fato.
 */
let cachedPrefs: NotificationPrefs = DEFAULT_PREFS;
const listeners = new Set<() => void>();

function getSnapshot(): NotificationPrefs {
  return cachedPrefs;
}

function getServerSnapshot(): NotificationPrefs {
  return DEFAULT_PREFS;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function loadPrefsFromStorage() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_PREFS_STORAGE_KEY);
    cachedPrefs = raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    cachedPrefs = DEFAULT_PREFS;
  }
  listeners.forEach((listener) => listener());
}

function writePref(key: NotificationKey, checked: boolean) {
  cachedPrefs = { ...cachedPrefs, [key]: checked };
  try {
    localStorage.setItem(NOTIFICATION_PREFS_STORAGE_KEY, JSON.stringify(cachedPrefs));
  } catch {
    // localStorage indisponível (modo privado etc.) — preferência só vale para a sessão atual
  }
  listeners.forEach((listener) => listener());
}

function NotificacoesSection() {
  const prefs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Primeira leitura real do localStorage acontece após montar (evita
  // divergir do HTML renderizado no servidor, que não tem acesso a ele).
  useEffect(() => {
    loadPrefsFromStorage();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
        <CardDescription>Preferências salvas neste navegador.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {NOTIFICATION_PREFS.map((item) => (
          <Field key={item.key} orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor={item.key}>{item.label}</FieldLabel>
              <FieldDescription>{item.description}</FieldDescription>
            </FieldContent>
            <Switch
              id={item.key}
              checked={prefs[item.key]}
              onCheckedChange={(checked) => writePref(item.key, checked)}
            />
          </Field>
        ))}
      </CardContent>
    </Card>
  );
}
