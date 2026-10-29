// Conteúdo do app. Para trocar/adicionar orações, edite esta lista.
// A oração do dia é escolhida pelo número do dia (rodízio sem fim).

export const PRAYERS = [
  { t: "Silêncio", h: "Aquieta-te", b: "Pai, antes que o barulho deste dia comece, venho a Ti em silêncio. Deponho a pressa e a preocupação com que acordei. Ensina-me a ficar quieto o bastante para lembrar que Tu és Deus e eu não sou. Aquieta o meu coração como a água sobre a qual não sopra vento.", v: "Aquietai-vos e sabei que eu sou Deus.", r: "Salmos 46:10 (ACF)" },
  { t: "Gratidão", h: "Um Coração Grato", b: "Senhor, este é o dia que Tu fizeste. Antes de pedir qualquer coisa, deixa-me agradecer pelo fôlego, pela luz da manhã, por mais uma chance de recomeçar. Desvia os meus olhos do que falta para o que me foi dado. Que a gratidão seja a primeira língua que o meu coração fala hoje.", v: "Este é o dia que fez o Senhor.", r: "Salmos 118:24 (ACF)" },
  { t: "Confiança", h: "Nas Tuas Mãos", b: "Deus, eu não entendo tudo o que hoje reserva, e não preciso entender. Entrego a Ti as partes que não consigo controlar e as perguntas que não consigo responder. Ajuda-me a me apoiar em Ti, e não no meu próprio entendimento, e a dar o próximo pequeno passo em fé.", v: "Confia no Senhor de todo o teu coração.", r: "Provérbios 3:5 (ACF)" },
  { t: "Paz", h: "Aquieta a Minha Mente", b: "Pai, a minha mente está agitada esta manhã. Onde há ansiedade, traze paz; onde há medo, traze a Tua presença firme. Recebo a paz que só Tu dás, que o mundo não pode dar nem tirar. Que ela guarde o meu coração em tudo o que acontecer hoje.", v: "Deixo-vos a paz, a minha paz vos dou.", r: "João 14:27 (ACF)" },
  { t: "Provisão", h: "O Pão de Cada Dia", b: "Senhor, Tu sabes do que preciso antes mesmo de eu pedir. Não peço o ano inteiro, apenas o dia de hoje — força suficiente, provisão suficiente, graça suficiente para as horas à minha frente. Ensina-me a confiar em Ti um dia de cada vez, e a repartir o que recebo.", v: "O pão nosso de cada dia nos dá hoje.", r: "Mateus 6:11 (ACF)" },
  { t: "Força", h: "Forças Renovadas", b: "Pai, estou cansado em lugares que só Tu enxergas. Espero em Ti esta manhã e Te peço que renove o que está gasto em mim. Levanta-me quando o dia ficar pesado. Que eu o atravesse sem desfalecer, sustentado pela Tua força e não pela minha.", v: "Os que esperam no Senhor renovarão as suas forças.", r: "Isaías 40:31 (ACF)" },
  { t: "Descanso", h: "Vem e Descansa", b: "Senhor, eu carrego mais do que fui feito para carregar. Esta manhã trago o peso a Ti em vez de arrastá-lo sozinho. Obrigado porque o Teu convite continua de pé — vir a Ti e encontrar descanso. Que a minha alma respire de novo sob o Teu cuidado gentil hoje.", v: "Vinde a mim... e eu vos aliviarei.", r: "Mateus 11:28 (ACF)" },
  { t: "Esperança", h: "Novas a Cada Manhã", b: "Pai, seja o que for que ontem trouxe, a Tua misericórdia me encontra nova hoje. Solto o que não posso mudar e recebo um novo começo. Onde eu havia desistido, planta esperança de novo. Ajuda-me a esperar a Tua bondade nas horas comuns que estão por vir.", v: "Novas são cada manhã; grande é a tua fidelidade.", r: "Lamentações 3:23 (ACF)" },
  { t: "Direção", h: "Dirige os Meus Passos", b: "Senhor, não quero caminhar hoje no escuro. Sê lâmpada para os meus pés — luz suficiente para o próximo passo, mesmo quando não vejo a estrada inteira. Guia as minhas decisões, as minhas palavras e o meu tempo. Mantém-me no caminho que leva à vida e à paz.", v: "Lâmpada para os meus pés é a tua palavra.", r: "Salmos 119:105 (ACF)" },
  { t: "Paciência", h: "Esperar Bem", b: "Pai, eu não sou bom em esperar, e Tu sabes disso. Fortalece o meu coração enquanto a resposta ainda está a caminho. Guarda-me de arrombar portas ou de correr à Tua frente. Ensina-me que esperar em Ti não é tempo perdido, mas confiança sendo formada em mim.", v: "Espera no Senhor... e ele fortalecerá o teu coração.", r: "Salmos 27:14 (ACF)" },
  { t: "Coragem", h: "Não Temas", b: "Senhor, há algo hoje que eu preferia evitar. Dá-me a coragem que vem de saber que não estou sozinho. Tu vais à minha frente e estás comigo por onde eu for. Que eu encare o que preciso encarar esta manhã sem ser dominado pelo medo.", v: "Esforça-te e tem bom ânimo; não temas.", r: "Josué 1:9 (ACF)" },
  { t: "Contentamento", h: "O Bastante para Hoje", b: "Pai, ensina-me a me contentar com o que tenho agora, sem invejar o que não tenho. Guarda-me da inquietação que sempre quer mais. Que eu encontre paz na Tua presença, e não nas minhas circunstâncias, e descanse na verdade de que Tu me bastas.", v: "Aprendi a contentar-me com o que tenho.", r: "Filipenses 4:11 (ACF)" },
  { t: "Presença", h: "Tu Estás Perto", b: "Senhor, mesmo que hoje me leve por um vale difícil, não temerei, porque Tu estás comigo. Faze a Tua presença ser real para mim — não só uma ideia, mas um consolo que eu possa sentir. Caminha ao meu lado em cada sala e cada conversa deste dia.", v: "Ainda que eu andasse pelo vale da sombra da morte... tu estás comigo.", r: "Salmos 23:4 (ACF)" },
  { t: "Renovação", h: "Faze-me Novo", b: "Pai, eu não quero continuar o mesmo. Onde endureci, amolece-me. Onde esfriei, aquece-me de novo. Obrigado porque, em Ti, as coisas velhas passam e tudo pode se tornar novo. Começa essa obra em mim esta manhã, em silêncio e profundamente.", v: "Se alguém está em Cristo... todas as coisas se fizeram novas.", r: "2 Coríntios 5:17 (ACF)" },
];

export const LEVELS = [
  { n: "Primeiras águas", min: 0 },
  { n: "Riacho", min: 7 },
  { n: "Rio", min: 30 },
  { n: "Lago", min: 100 },
  { n: "Mar sereno", min: 365 },
];

export const BADGES = [
  { d: 3, n: "Primeiro passo", e: "🌱" },
  { d: 7, n: "Uma semana fiel", e: "💧" },
  { d: 30, n: "Um mês em paz", e: "🌊" },
  { d: 100, n: "Cem manhãs", e: "🕊️" },
  { d: 200, n: "Perseverança", e: "⚓" },
  { d: 365, n: "Um ano de oração", e: "⭐" },
];

export function levelOf(total) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (total >= LEVELS[k].min) i = k;
  return i;
}
