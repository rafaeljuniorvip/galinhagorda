import { getAllChampionships, getChampionshipById } from '@/services/championshipService';
import { listMatches, getMatchById } from '@/services/matchService';
import { getEventsByMatch } from '@/services/matchEventService';
import { getChampionshipStandings, getTopScorers, getDisciplinaryRanking, getPlayerStats } from '@/services/statsService';
import { getAllTeams, getTeamById } from '@/services/teamService';
import { getPlayerById } from '@/services/playerService';
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
  focus?: 'geral' | 'jogo' | 'time' | 'jogador';
  focus_id?: string;
  style?: string;
  context?: string;
}

async function gatherContext(options: GenerateOptions) {
  const { championship_id: championshipId, focus, focus_id } = options;

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

  // Focus-specific context
  let focusContext: any = null;

  if (focus === 'jogo' && focus_id) {
    const match = await getMatchById(focus_id);
    if (match) {
      const events = await getEventsByMatch(focus_id);
      focusContext = {
        type: 'jogo',
        match: {
          id: match.id,
          home_team: match.home_team_name,
          away_team: match.away_team_name,
          home_score: match.home_score,
          away_score: match.away_score,
          date: match.match_date,
          round: match.match_round,
          status: match.status,
          venue: match.venue,
          referee: match.referee_name || match.referee,
          championship: match.championship_name,
        },
        events: events.map((e) => ({
          type: e.event_type,
          player: e.player_name,
          team: e.team_name,
          minute: e.minute,
          half: e.half,
        })),
      };
    }
  } else if (focus === 'time' && focus_id) {
    const team = await getTeamById(focus_id);
    if (team) {
      focusContext = {
        type: 'time',
        team: {
          name: team.name,
          short_name: team.short_name,
          city: team.city,
          founded_year: team.founded_year,
        },
      };
    }
  } else if (focus === 'jogador' && focus_id) {
    const player = await getPlayerById(focus_id);
    if (player) {
      const stats = await getPlayerStats(focus_id, championshipId);
      focusContext = {
        type: 'jogador',
        player: {
          name: player.full_name,
          nickname: player.nickname,
          position: player.position,
          city: player.city,
        },
        stats: stats.map((s) => ({
          championship: s.championship_name,
          team: s.team_name,
          matches: s.matches_played,
          goals: s.goals,
          yellow_cards: s.yellow_cards,
          red_cards: s.red_cards,
        })),
      };
    }
  }

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
    focusContext,
  };
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  cronica: 'Escreva no estilo de CRONICA DE JOGO: narrativa envolvente, descrevendo os principais momentos, emoções e lances decisivos.',
  analise: 'Escreva no estilo de ANALISE TATICA/TECNICA: foco em estratégias, formações, desempenho coletivo e individual dos times.',
  preview: 'Escreva no estilo de PREVIEW/EXPECTATIVA: antecipe os próximos jogos, destaque confrontos-chave, retrospecto e expectativas.',
  destaque: 'Escreva no estilo de DESTAQUE DE JOGADOR: foque em um jogador específico, suas estatísticas, atuação recente e importância para o time.',
  classificacao: 'Escreva no estilo de ANALISE DE CLASSIFICACAO: analise a tabela, corrida pelo título, luta contra rebaixamento, desempenho dos times.',
  bastidores: 'Escreva no estilo de BASTIDORES E CURIOSIDADES: traga informações interessantes, curiosidades, fatos inusitados e bastidores do campeonato.',
};

function buildPrompt(context: Awaited<ReturnType<typeof gatherContext>>, options: GenerateOptions) {
  const { count, focus, style, context: userContext } = options;

  let styleInstruction = '- Varie os tipos de matéria: crônica de jogo, preview de rodada, análise tática, destaque de jogador/artilheiro, ranking/classificação, matéria sobre disciplina/fair play.';
  if (style && style !== 'auto' && STYLE_INSTRUCTIONS[style]) {
    styleInstruction = `- ${STYLE_INSTRUCTIONS[style]}`;
  }

  let focusInstruction = '';
  if (context.focusContext) {
    if (context.focusContext.type === 'jogo') {
      const m = context.focusContext.match;
      focusInstruction = `\n\nFOCO PRINCIPAL: A notícia DEVE ser sobre o jogo ${m.home_team} x ${m.away_team} (${m.status}${m.home_score !== null ? `, placar: ${m.home_score}x${m.away_score}` : ''}).`;
      if (context.focusContext.events?.length > 0) {
        focusInstruction += `\nEventos do jogo:\n${JSON.stringify(context.focusContext.events, null, 2)}`;
      }
    } else if (context.focusContext.type === 'time') {
      focusInstruction = `\n\nFOCO PRINCIPAL: A notícia DEVE ser focada no time ${context.focusContext.team.name}. Destaque seu desempenho, resultados recentes, posição na tabela e jogadores.`;
    } else if (context.focusContext.type === 'jogador') {
      const p = context.focusContext.player;
      focusInstruction = `\n\nFOCO PRINCIPAL: A notícia DEVE ser focada no jogador ${p.name}${p.nickname ? ` (${p.nickname})` : ''}, posição: ${p.position}.`;
      if (context.focusContext.stats?.length > 0) {
        focusInstruction += `\nEstatísticas:\n${JSON.stringify(context.focusContext.stats, null, 2)}`;
      }
    }
  }

  let userContextInstruction = '';
  if (userContext && userContext.trim()) {
    userContextInstruction = `\n\nCONTEXTO ADICIONAL DO EDITOR (use como guia para o tom/conteúdo da matéria):\n"${userContext.trim()}"`;
  }

  const systemPrompt = `Você é um jornalista esportivo brasileiro especializado em futebol amador e regional. Seu estilo é engajante, apaixonado e informativo, escrevendo em português brasileiro.

Regras:
- Use APENAS os dados fornecidos. NUNCA invente resultados, placar, gols ou estatísticas.
- O conteúdo deve ser em HTML usando apenas: <p>, <strong>, <em>, <h3>, <ul>, <li>. NÃO use <h1>, <h2> ou <br>.
${styleInstruction}
- Cada artigo deve ter entre 3 e 6 parágrafos.
- O campo "summary" deve ter no máximo 200 caracteres.
- NÃO repita assuntos já cobertos (lista de títulos existentes fornecida).
- Responda SOMENTE com JSON válido no formato especificado.${focusInstruction}${userContextInstruction}`;

  // Build context data without focusContext to avoid duplication in user prompt
  const { focusContext: _, ...contextData } = context;

  const userPrompt = `Dados do campeonato:
${JSON.stringify(contextData, null, 2)}

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
      model: 'google/gemini-3-flash-preview',
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
  const context = await gatherContext(options);
  const { systemPrompt, userPrompt } = buildPrompt(context, options);
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
        is_published: false,
      });
      saved.push(news);
    } catch (err) {
      console.error(`[AI News] Erro ao salvar artigo "${article.title}":`, err);
    }
  }

  return { count: saved.length, articles: saved };
}
