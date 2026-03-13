import { query, getOne } from '@/lib/db';

const DEMO_TEAMS = [
  { name: 'Estrela Vermelha FC', short_name: 'EVF', primary_color: '#d32f2f', secondary_color: '#ffffff' },
  { name: 'Águia Dourada EC', short_name: 'AGD', primary_color: '#f9a825', secondary_color: '#1a237e' },
  { name: 'Trovão Azul SC', short_name: 'TAZ', primary_color: '#1565c0', secondary_color: '#ffffff' },
  { name: 'Leões da Serra', short_name: 'LDS', primary_color: '#2e7d32', secondary_color: '#ffd600' },
  { name: 'Falcões Unidos', short_name: 'FAU', primary_color: '#6a1b9a', secondary_color: '#ffffff' },
  { name: 'Tigres do Vale', short_name: 'TDV', primary_color: '#e65100', secondary_color: '#000000' },
];

const POSITIONS = ['Goleiro', 'Zagueiro', 'Zagueiro', 'Lateral Direito', 'Lateral Esquerdo', 'Volante', 'Meia', 'Meia Atacante', 'Atacante', 'Ponta Direita'];

const FIRST_NAMES = [
  'Lucas', 'Gabriel', 'Pedro', 'Rafael', 'Matheus', 'Bruno', 'Felipe', 'Thiago',
  'Anderson', 'Carlos', 'Diego', 'Eduardo', 'Fernando', 'Gustavo', 'Hugo', 'Igor',
  'João', 'Kléber', 'Leonardo', 'Marcos', 'Nicolas', 'Otávio', 'Paulo', 'Ricardo',
  'Samuel', 'Tiago', 'Vinícius', 'Wagner', 'Yago', 'André', 'Breno', 'Caio',
  'Daniel', 'Emerson', 'Fábio', 'Gilberto', 'Henrique', 'Ivan', 'Jorge', 'Kevin',
  'Luís', 'Murilo', 'Nathan', 'Oscar', 'Patrick', 'Renan', 'Sérgio', 'Túlio',
  'Ubiratan', 'Victor', 'Wesley', 'Xavier', 'Yan', 'Zé Roberto', 'Adriano', 'Bernardo',
  'Cristiano', 'Davi', 'Elias', 'Fabrício',
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Lima', 'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha',
  'Ribeiro', 'Alves', 'Monteiro', 'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moura',
  'Cavalcanti', 'Dias', 'Castro', 'Campos', 'Cardoso', 'Teixeira',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a complete demo championship with fictitious data.
 * Returns the championship ID.
 */
export async function generateDemoData(): Promise<string> {
  // Check if demo data already exists
  const existing = await getOne<{ id: string }>('SELECT id FROM championships WHERE is_demo = true LIMIT 1');
  if (existing) return existing.id;

  // 1. Create championship
  const champResult = await query(
    `INSERT INTO championships (id, name, short_name, year, season, category, format, start_date, end_date, status, location, description, is_demo)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
     RETURNING id`,
    [
      'Copa Demo 2026',
      'DEMO',
      2026,
      '1',
      'Principal',
      'Pontos Corridos',
      '2026-03-01',
      '2026-06-30',
      'Em Andamento',
      'Itapecerica - MG',
      'Campeonato demonstrativo gerado automaticamente para testes do aplicativo.',
    ]
  );
  const championshipId = champResult.rows[0].id;

  // 2. Create teams
  const teamIds: string[] = [];
  for (const team of DEMO_TEAMS) {
    const result = await query(
      `INSERT INTO teams (id, name, short_name, primary_color, secondary_color, city, state, active, is_demo)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Itapecerica', 'MG', true, true)
       RETURNING id`,
      [team.name, team.short_name, team.primary_color, team.secondary_color]
    );
    teamIds.push(result.rows[0].id);

    // Enroll team in championship
    await query(
      `INSERT INTO team_championships (id, team_id, championship_id, status)
       VALUES (gen_random_uuid(), $1, $2, 'Ativo')`,
      [result.rows[0].id, championshipId]
    );
  }

  // 3. Create players and register them
  const usedNames = new Set<string>();
  const teamPlayers: Record<string, string[]> = {};

  for (let t = 0; t < teamIds.length; t++) {
    const teamId = teamIds[t];
    teamPlayers[teamId] = [];

    for (let p = 0; p < 10; p++) {
      let fullName = '';
      do {
        fullName = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;
      } while (usedNames.has(fullName));
      usedNames.add(fullName);

      const firstName = fullName.split(' ')[0];
      const position = POSITIONS[p];

      const playerResult = await query(
        `INSERT INTO players (id, full_name, name, position, dominant_foot, city, state, active, is_demo)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Itapecerica', 'MG', true, true)
         RETURNING id`,
        [fullName, firstName, position, randomItem(['Direito', 'Esquerdo', 'Ambidestro'])]
      );
      const playerId = playerResult.rows[0].id;
      teamPlayers[teamId].push(playerId);

      // Register player in championship
      await query(
        `INSERT INTO player_registrations (id, player_id, team_id, championship_id, shirt_number, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'Ativo')`,
        [playerId, teamId, championshipId, p + 1]
      );
    }
  }

  // 4. Create matches (round-robin, first half done)
  const matchPairs: [number, number][] = [];
  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      matchPairs.push([i, j]);
    }
  }

  // Shuffle matches
  for (let i = matchPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matchPairs[i], matchPairs[j]] = [matchPairs[j], matchPairs[i]];
  }

  const finishedCount = Math.floor(matchPairs.length * 0.6);
  const baseDate = new Date('2026-03-08T15:00:00');

  for (let m = 0; m < matchPairs.length; m++) {
    const [homeIdx, awayIdx] = matchPairs[m];
    const homeTeamId = teamIds[homeIdx];
    const awayTeamId = teamIds[awayIdx];
    const isFinished = m < finishedCount;

    const matchDate = new Date(baseDate);
    matchDate.setDate(matchDate.getDate() + m * 3);
    if (m % 2 === 1) matchDate.setHours(17, 0, 0);

    const homeScore = isFinished ? randomInt(0, 4) : null;
    const awayScore = isFinished ? randomInt(0, 3) : null;
    const round = `Rodada ${Math.floor(m / 3) + 1}`;

    const matchResult = await query(
      `INSERT INTO matches (id, championship_id, home_team_id, away_team_id, home_score, away_score, match_date, match_round, venue, status)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        championshipId,
        homeTeamId,
        awayTeamId,
        homeScore,
        awayScore,
        matchDate.toISOString(),
        round,
        'Campo Municipal de Itapecerica',
        isFinished ? 'Finalizada' : 'Agendada',
      ]
    );

    // 5. Create events for finished matches
    if (isFinished && matchResult.rows[0]) {
      const matchId = matchResult.rows[0].id;

      // Home goals
      for (let g = 0; g < (homeScore || 0); g++) {
        const scorerId = randomItem(teamPlayers[homeTeamId]);
        await query(
          `INSERT INTO match_events (id, match_id, player_id, team_id, event_type, minute, half)
           VALUES (gen_random_uuid(), $1, $2, $3, 'GOL', $4, $5)`,
          [matchId, scorerId, homeTeamId, randomInt(1, 45) + (g > 1 ? 45 : 0), g > 1 ? '2T' : '1T']
        );
      }

      // Away goals
      for (let g = 0; g < (awayScore || 0); g++) {
        const scorerId = randomItem(teamPlayers[awayTeamId]);
        await query(
          `INSERT INTO match_events (id, match_id, player_id, team_id, event_type, minute, half)
           VALUES (gen_random_uuid(), $1, $2, $3, 'GOL', $4, $5)`,
          [matchId, scorerId, awayTeamId, randomInt(1, 45) + (g > 0 ? 45 : 0), g > 0 ? '2T' : '1T']
        );
      }

      // Random yellow cards (1-3 per match)
      const yellowCount = randomInt(1, 3);
      for (let c = 0; c < yellowCount; c++) {
        const teamId = Math.random() > 0.5 ? homeTeamId : awayTeamId;
        const playerId = randomItem(teamPlayers[teamId]);
        await query(
          `INSERT INTO match_events (id, match_id, player_id, team_id, event_type, minute, half)
           VALUES (gen_random_uuid(), $1, $2, $3, 'CARTAO_AMARELO', $4, $5)`,
          [matchId, playerId, teamId, randomInt(10, 88), Math.random() > 0.5 ? '2T' : '1T']
        );
      }
    }
  }

  return championshipId;
}
