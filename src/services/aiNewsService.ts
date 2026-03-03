import { getAllChampionships, getChampionshipById } from '@/services/championshipService';
import { listMatches } from '@/services/matchService';
import { getEventsByMatch } from '@/services/matchEventService';
import { getChampionshipStandings, getTopScorers, getDisciplinaryRanking } from '@/services/statsService';
import { getAllTeams } from '@/services/teamService';
import { listNews, createNews } from '@/services/newsService';
import { slugify } from '@/lib/utils';

interface AIArticle {
  title: string;
  summary: string;
  content: string;
  championship_id?: string;
}

interface GenerateOptions {
  championship_id?: string;
  count: number;
  author_id: string;
}

async function gatherContext(championshipId?: string) {
  const championships = championshipId
    ? [await getChampionshipById(championshipId)].filter(Boolean)
    : await getAllChampionships();

  const targetIds = championships.map((c) => c!.id);

  // Fetch matches for each championship (last 50)
  const matchesMap: Record<string, any[]> = {};
  for (const cid of targetIds) {
    const result = await listMatches({ championship_id: cid, limit: 50 });
    matchesMap[cid] = result.data.map((m) => ({
      home_team: m.home_team_name,
      away_team: m.away_team_name,
      home_score: m.home_score,
      away_score: m.away_score,
      date: m.match_date,
      round: m.match_round,
      status: m.status,
      venue: m.venue,
      id: m.id,
    }));
  }

  // Fetch events for last 10 finished matches across all championships
  const allMatches = Object.values(matchesMap).flat();
  const finishedMatches = allMatches
    .filter((m) => m.status === 'Finalizada')
    .slice(0, 10);

  const eventsMap: Record<string, any[]> = {};
  for (const match of finishedMatches) {
    const events = await getEventsByMatch(match.id);
    eventsMap[match.id] = events.map((e) => ({
      type: e.event_type,
      player: e.player_name,
      team: e.team_name,
      minute: e.minute,
      half: e.half,
    }));
  }

  // Standings, top scorers, disciplinary for each championship
  const standingsMap: Record<string, any[]> = {};
  const scorersMap: Record<string, any[]> = {};
  const cardsMap: Record<string, any[]> = {};

  for (const cid of targetIds) {
    standingsMap[cid] = (await getChampionshipStandings(cid)).map((s) => ({
      team: s.team_name,
      points: s.points,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goals_for: s.goals_for,
      goals_against: s.goals_against,
      matches_played: s.matches_played,
    }));

    scorersMap[cid] = (await getTopScorers(cid, 10)).map((s: any) => ({
      player: s.player_name,
      team: s.team_name,
      goals: s.goals,
    }));

    cardsMap[cid] = (await getDisciplinaryRanking(cid, 10)).map((d) => ({
      player: d.player_name,
      team: d.team_name,
      yellow: d.yellow_cards,
      red: d.red_cards,
    }));
  }

  // Teams
  const teams = (await getAllTeams()).map((t) => ({
    name: t.name,
    city: t.city,
  }));

  // Existing news titles to avoid repetition
  const existingNews = await listNews({ limit: 30 });
  const existingTitles = existingNews.data.map((n) => n.title);

  return {
    championships: championships.map((c) => ({
      id: c!.id,
      name: c!.name,
      year: c!.year,
      status: c!.status,
      format: c!.format,
      category: c!.category,
      location: c!.location,
      start_date: c!.start_date,
      end_date: c!.end_date,
    })),
    matches: matchesMap,
    events: eventsMap,
    standings: standingsMap,
    topScorers: scorersMap,
    disciplinary: cardsMap,
    teams,
    existingTitles,
  };
}

function buildPrompt(context: Awaited<ReturnType<typeof gatherContext>>, count: number) {
  const systemPrompt = `Você é um jornalista esportivo brasileiro especializado em futebol amador e regional. Seu estilo é engajante, apaixonado e informativo, escrevendo em português brasileiro.

Regras:
- Use APENAS os dados fornecidos. NUNCA invente resultados, placar, gols ou estatísticas.
- O conteúdo deve ser em HTML usando apenas: <p>, <strong>, <em>, <h3>, <ul>, <li>. NÃO use <h1>, <h2> ou <br>.
- Varie os tipos de matéria: crônica de jogo, preview de rodada, análise tática, destaque de jogador/artilheiro, ranking/classificação, matéria sobre disciplina/fair play.
- Cada artigo deve ter entre 3 e 6 parágrafos.
- O campo "summary" deve ter no máximo 200 caracteres.
- NÃO repita assuntos já cobertos (lista de títulos existentes fornecida).
- Responda SOMENTE com JSON válido no formato especificado.`;

  const userPrompt = `Dados do campeonato:
${JSON.stringify(context, null, 2)}

Gere exatamente ${count} artigo(s) de notícia baseado(s) nos dados acima.

Títulos já publicados (NÃO repita estes assuntos):
${context.existingTitles.length > 0 ? context.existingTitles.map((t) => `- ${t}`).join('\n') : '(nenhuma notícia publicada ainda)'}

Responda no formato JSON:
{
  "articles": [
    {
      "title": "Título da notícia",
      "summary": "Resumo curto (max 200 chars)",
      "content": "<p>Conteúdo HTML da notícia...</p>",
      "championship_id": "ID do campeonato relacionado ou null"
    }
  ]
}`;

  return { systemPrompt, userPrompt };
}

async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<AIArticle[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://galinhagorda.vip',
      'X-Title': 'Galinha Gorda - Gerador de Noticias',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AI News] OpenRouter error:', response.status, errorBody);
    throw new Error(`OpenRouter retornou status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Resposta vazia da IA');
  }

  const parsed = JSON.parse(content);

  if (!parsed.articles || !Array.isArray(parsed.articles)) {
    throw new Error('Formato de resposta inválido da IA');
  }

  return parsed.articles;
}

export async function generateAINews(options: GenerateOptions) {
  const context = await gatherContext(options.championship_id);
  const { systemPrompt, userPrompt } = buildPrompt(context, options.count);
  const articles = await callOpenRouter(systemPrompt, userPrompt);

  const saved: any[] = [];
  const timestamp = Date.now().toString(36);

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];

    if (!article.title || !article.content) continue;

    const slug = slugify(article.title) + '-' + timestamp + i;

    // Resolve championship_id: use provided or from context
    let champId = article.championship_id;
    if (!champId && options.championship_id) {
      champId = options.championship_id;
    }
    // Validate championship_id exists in context
    const validChampIds = context.championships.map((c) => c.id);
    if (champId && !validChampIds.includes(champId)) {
      champId = options.championship_id || undefined;
    }

    try {
      const news = await createNews({
        title: article.title,
        slug,
        summary: article.summary || undefined,
        content: article.content,
        championship_id: champId || undefined,
        author_id: options.author_id,
        is_published: false,
      });
      saved.push(news);
    } catch (err) {
      console.error(`[AI News] Erro ao salvar artigo "${article.title}":`, err);
    }
  }

  return { count: saved.length, articles: saved };
}
