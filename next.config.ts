import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Router Cache do cliente: voltar a uma aba visitada nos últimos 60s é
    // instantâneo, sem round-trip. As Server Actions chamam revalidatePath,
    // que invalida este cache — edições do próprio usuário aparecem na hora.
    staleTimes: { dynamic: 60, static: 300 },
  },
};

export default nextConfig;
