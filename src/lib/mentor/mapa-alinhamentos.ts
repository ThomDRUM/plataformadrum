export interface AlinhamentoItem {
  numero: number;
  titulo: string;
  quem: string;
  quando: string;
  perguntas?: string;
  conversa?: string;
  porque: string;
}

export interface FaseAlinhamento {
  fase: 0 | 1 | 2;
  titulo: string;
  alinhamentos: AlinhamentoItem[];
  blocoAdicionalTitulo: string;
  blocoAdicionalTexto: string | { label: string; texto: string }[];
}

export const PREMISSAS_TEXTO = [
  "Na nossa ótica, a governança não começa pelos documentos — começa pelas conversas. Os instrumentos que a família precisa (protocolo, acordo de quotistas, conselhos etc.) são a formalização de alinhamentos bem-feitos, não o ponto de partida. Alinhamentos e ritos são a forma como a família cria espaços estruturados para conversar sobre temas importantes, construir alinhamento, tomar melhores decisões e formalizar acordos.",
  "A sequência respeita dois movimentos: primeiro o peer-to-peer (cada geração se alinha internamente, porque uma geração só se torna relevante no sistema se tiver força conjunta e conforto na divisão de papéis), depois o diálogo intergeracional (conversa facilitada entre gerações, com cada participante previamente preparado). Só então entramos nos alinhamentos que produzem cada estrutura.",
];

export const FASES_ALINHAMENTO: FaseAlinhamento[] = [
  {
    fase: 0,
    titulo: "Fase 0 — Conexão peer-to-peer",
    alinhamentos: [
      {
        numero: 1,
        titulo: "Alinhamento dos sócios atuais",
        quem: "Todos da geração sênior.",
        quando: "Após todos completarem o módulo 1.",
        perguntas:
          "O que cada um de nós quer para o futuro da família empreendedora? Como imaginamos a próxima geração tomando parte disso? Como cada um de nós gostaria de atuar no futuro? Quais perguntas temos para a próxima geração?",
        porque:
          "Entender qual a visão que cada um tem para o futuro da família empreendedora e identificar o quão alinhadas estão. A sucessão depende do timing do sucedido, do espaço que existe ou não para ela acontecer.",
      },
      {
        numero: 2,
        titulo: "Alinhamento da próxima geração",
        quem: "Todos da próxima geração.",
        quando: "Após todos completarem o módulo 1.",
        perguntas:
          "Quais são as minhas expectativas para o futuro da família empreendedora? Como eu me vejo participando disso? Quais as minhas perguntas para a geração anterior?",
        porque:
          "A geração precisa de um espaço seguro e sem a presença da geração anterior para falar sobre a sucessão de forma livre.",
      },
    ],
    blocoAdicionalTitulo: "Alinhamentos adicionais",
    blocoAdicionalTexto: [
      {
        label: "Antes de irmos para os diálogos intergeracionais, cada uma das gerações deve conversar até conseguir atingir:",
        texto: "",
      },
      {
        label: "Geração anterior",
        texto:
          "Alinhamento sobre qual a mensagem que querem transmitir à próxima geração sobre o futuro da família empreendedora, qual expectativa sobre a participação da próxima geração e como cada sócio pretende atuar no futuro.",
      },
      {
        label: "Próxima geração",
        texto:
          "Chegar as perguntas que a próxima geração gostaria de fazer à geração anterior. Cada um também precisa ter clareza sobre a sua expectativa para o futuro da família empreendedora e dos negócios, qual papel gostaria de ter nesse sistema (gestor, governança, apenas acionista) e como ele contribui para a dinâmica complementar da família.",
      },
    ],
  },
  {
    fase: 1,
    titulo: "Fase 1 — Diálogo intergeracional",
    alinhamentos: [
      {
        numero: 3,
        titulo: "Diálogo intergeracional — núcleo familiar",
        quem: "Cada sócio + seus respectivos filhos da próxima geração.",
        quando:
          "Depois que cada geração se preparou na Fase 0, os sócios já com a visão conjunta esboçada e a próxima geração já com os papéis que cada um quer ocupar.",
        conversa:
          "A ideia desta primeira conversa entre os núcleos familiares é cada geração apresentar o que foi trabalhado na fase 0. A próxima geração começa fazendo as perguntas à geração anterior e o diálogo segue até que os mais jovens estejam satisfeitos com as respostas. Após isso, é a vez da geração anterior fazer as perguntas esclarecedoras até que tenha suas respostas. Neste diálogo cada geração deve deixar claro suas expectativas para o futuro da família empreendedora e como se vê atuando no sistema familiar.",
        porque:
          "É a conversa facilitada entre as gerações para alinhar expectativas dentro do núcleo familiar antes levar ao resto da família. O objetivo é trazer à mesa os temas que normalmente ficam implícitos para identificar onde estão os principais pontos de tensão no sistema familiar. Cada participante chega preparado pela Fase 0, o que permite o diálogo sem que ele vire conflito. Estes pontos de tensão no sistema familiar podem ser: divergência de percepções (cada pessoa/geração enxerga a outra ou a si mesma com uma perspectiva diferente); divergência de visões (cada pessoa/geração enxergam o futuro de formas diferentes, querem coisas diferentes); conflitos nas relações (histórias mal resolvidas que viram nós no caminho da sucessão).",
      },
      {
        numero: 4,
        titulo: "Diálogo intergeracional — família empreendedora",
        quem: "Todos os sócios + próxima geração.",
        quando: "Depois das conversas de cada núcleo.",
        conversa:
          "A ideia desta conversa é ter uma primeira reunião com todos juntos. Nessa reunião três coisas acontecem: (1) a geração anterior introduz um novo tópico sobre a história da família empreendedora, falando do barro criador e daquilo que acredita ser importante para transmitir e manter na família; (2) a próxima geração fala sobre a sua visão de futuro representando todos da geração havendo ou não consenso; (3) o facilitador apresenta um consolidado dos pontos de tensão da família através da pontuação no framework de resistência da sucessão, garante que todos estejam na mesma página em relação ao entendimento dos pontos, e passa pelos três objetivos que temos com os alinhamentos a partir deste momento: trabalhar a harmonia da família (governança familiar), proteger o negócio (governança corporativa) e definir as diretrizes da família empreendedora (governança de propriedade).",
        porque: "",
      },
    ],
    blocoAdicionalTitulo: "Alinhamentos e conversas adicionais",
    blocoAdicionalTexto:
      "Antes de seguirmos para o diálogo intergeracional com todos os núcleos familiares juntos, cada núcleo precisa entender quais são os pontos de tensão que existem e as visões predominantes em cada geração (e no núcleo familiar se houver consenso) sobre o futuro da família empreendedora e como se vê atuando no sistema familiar.",
  },
  {
    fase: 2,
    titulo: "Fase 2 — Os três objetivos da governança",
    alinhamentos: [
      {
        numero: 5,
        titulo: "Harmonia familiar",
        quem: "Ambas as gerações (definir se cônjuges participam como ouvintes). Não existe uma regra clara para quantos encontros é preciso ter aqui e nem quem participa de cada. É comum que haja a necessidade de encontros de alinhamento entre os sócios da geração sênior antes de encontros com todos. Depende de cada dinâmica familiar e do que o facilitador sente ser necessário.",
        quando: "Após a conclusão da Fase 1.",
        perguntas:
          "O que é esperado de cada membro, como todos se atualizam sobre os temas da família empreendedora e como a próxima geração é desenvolvida e aprende sobre a história familiar.",
        porque:
          "Serve para definir o protocolo familiar, a existência e propósito do conselho e assembléia familiar e o plano de desenvolvimento da próxima geração. Os encontros devem acontecer até que estes temas estejam definidos.",
      },
      {
        numero: 6,
        titulo: "Diretrizes da Família Empreendedora",
        quem: "Ambas as gerações. Existe um primeiro trabalho com os sócios para definir o mandato estratégico para os negócios e ativos da família (algum membro da próxima geração mais envolvido com o dia a dia dos negócios pode ser ouvido na elaboração da primeira versão). Após isso, a próxima geração é incluída como um todo para que sejam ouvidas as percepções gerais. Não existe uma regra clara para quantos encontros é preciso ter aqui e nem quem participa de cada. Depende de cada dinâmica familiar e do que o facilitador sente ser necessário.",
        quando: "Após a conclusão dos alinhamentos para trabalhar as condições para atingir a harmonia familiar.",
        perguntas:
          "O que a família quer dos negócios no longo prazo — crescimento, controle ou liquidez? Quais as prioridades que orientam a gestão? Como os sócios se alinham e tomam decisões no dia a dia?",
        porque:
          "Serve para definir o mandato estratégico para os negócios que será seguido pelos executivos familiares e não familiares, políticas de investimento, distribuição de dividendos e alavancagem, a existência e propósito do conselho de sócios e as bases para o acordo de acionistas.",
      },
      {
        numero: 7,
        titulo: "Proteger o negócio",
        quem: "Ambas as gerações. É comum que haja a necessidade de encontros de alinhamento entre os sócios da geração sênior antes de encontros com todos. No caso da discussão sobre política de empregabilidade é comum ter encontros apenas com quem já trabalha no negócio da família. Não existe uma regra clara para quantos encontros é preciso ter aqui e nem quem participa de cada. Depende de cada dinâmica familiar e do que o facilitador sente ser necessário.",
        quando: "Após a conclusão dos alinhamentos para definir as diretrizes da Família Empreendedora.",
        perguntas:
          "Quem pode trabalhar na empresa e quais são os critérios? Como os sócios fazem a gestão do negócio, transmitem o mandato estratégico e auditam os riscos e resultados?",
        porque:
          "Serve para definir o desdobramento estratégico e orçamento dos negócios, quem pode e quais as condições para ser um executivo familiar e existência e propósito do conselho consultivo ou de administração.",
      },
    ],
    blocoAdicionalTitulo: "",
    blocoAdicionalTexto: "",
  },
];
