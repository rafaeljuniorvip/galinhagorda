'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, Button, CircularProgress } from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { Match, MatchEvent, MatchLineup, Championship, PlayerRegistration } from '@/types';

function formatDate(date: string | null): string {
  if (!date) return '____/____/________';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatTime(date: string | null): string {
  if (!date) return '____:____';
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Styles
const PAGE_STYLE: React.CSSProperties = {
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  padding: '8mm 10mm',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: '9px',
  color: '#000',
  backgroundColor: '#fff',
  boxSizing: 'border-box',
};

const TABLE_STYLE: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
};

const CELL: React.CSSProperties = {
  border: '1px solid #000',
  padding: '2px 4px',
  fontSize: '8px',
  verticalAlign: 'middle',
  lineHeight: '1.3',
};

const CELL_CENTER: React.CSSProperties = {
  ...CELL,
  textAlign: 'center',
};

const HEADER_CELL: React.CSSProperties = {
  ...CELL,
  fontWeight: 'bold',
  textAlign: 'center',
  backgroundColor: '#e8e8e8',
  fontSize: '8px',
  textTransform: 'uppercase',
};

const SECTION_TITLE: React.CSSProperties = {
  fontWeight: 'bold',
  fontSize: '9px',
  textTransform: 'uppercase',
  padding: '3px 0',
  marginTop: '4px',
};

const BLANK_LINE: React.CSSProperties = {
  ...CELL,
  height: '16px',
};

export default function SumulaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineups, setLineups] = useState<{ home: MatchLineup[]; away: MatchLineup[] }>({ home: [], away: [] });
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [registrations, setRegistrations] = useState<PlayerRegistration[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) router.push('/admin/login');
  }, [isAdmin, authLoading, router]);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const [matchRes, eventsRes, lineupsRes] = await Promise.all([
      fetch(`/api/matches/${params.id}`),
      fetch(`/api/matches/${params.id}/events`),
      fetch(`/api/matches/${params.id}/lineups`),
    ]);
    if (matchRes.ok) {
      const m = await matchRes.json();
      setMatch(m);
      const [champRes, regRes] = await Promise.all([
        fetch(`/api/championships/${m.championship_id}`),
        fetch(`/api/championships/${m.championship_id}/registrations`),
      ]);
      if (champRes.ok) setChampionship(await champRes.json());
      if (regRes.ok) setRegistrations(await regRes.json());
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
    if (lineupsRes.ok) setLineups(await lineupsRes.json());
    setLoadingData(false);
  }, [params.id]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  if (authLoading || !isAdmin) return null;

  if (loadingData || !match) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Build BID map: player_id -> bid_number
  const bidMap = new Map<string, string>();
  registrations.forEach(r => {
    if (r.bid_number) bidMap.set(r.player_id, r.bid_number);
  });

  // Separate lineups
  const homeStarters = lineups.home.filter(l => l.is_starter);
  const homeSubs = lineups.home.filter(l => !l.is_starter);
  const awayStarters = lineups.away.filter(l => l.is_starter);
  const awaySubs = lineups.away.filter(l => !l.is_starter);

  // Events by type
  const goals = events.filter(e => ['GOL', 'GOL_PENALTI', 'GOL_CONTRA'].includes(e.event_type));
  const yellows = events.filter(e => ['CARTAO_AMARELO', 'SEGUNDO_AMARELO'].includes(e.event_type));
  const reds = events.filter(e => e.event_type === 'CARTAO_VERMELHO');
  const substitutions = events.filter(e =>
    ['SUBSTITUICAO_ENTRADA', 'SUBSTITUICAO_SAIDA'].includes(e.event_type)
  );

  // Pair substitutions: group SAI + ENTRA by minute + team
  const subPairs: { out: MatchEvent; inn: MatchEvent; half: string; minute: number | null; teamId: string }[] = [];
  const subOuts = substitutions.filter(s => s.event_type === 'SUBSTITUICAO_SAIDA');
  const subIns = substitutions.filter(s => s.event_type === 'SUBSTITUICAO_ENTRADA');
  subOuts.forEach(out => {
    const inn = subIns.find(i =>
      i.team_id === out.team_id && i.half === out.half && i.minute === out.minute
      && !subPairs.some(p => p.inn.id === i.id)
    );
    if (inn) {
      subPairs.push({ out, inn, half: out.half || '', minute: out.minute, teamId: out.team_id });
    }
  });

  // Goals by half
  const goals1T = goals.filter(g => g.half === '1T');
  const goals2T = goals.filter(g => g.half === '2T');

  // Referee names (prefer joined name, fallback to text field)
  const refereeName = match.referee_name || match.referee || '';
  const assistant1Name = match.assistant_referee_1_name || match.assistant_referee_1 || '';
  const assistant2Name = match.assistant_referee_2_name || match.assistant_referee_2 || '';

  // Fill player rows to a minimum of 23 lines per team
  const LINEUP_ROWS = 23;

  function buildPlayerRows(starters: MatchLineup[], subs: MatchLineup[]) {
    const all = [...starters, ...subs];
    const rows: { num: string; name: string; bid: string }[] = all.map(l => ({
      num: l.shirt_number != null ? String(l.shirt_number) : '',
      name: l.player_name || '',
      bid: bidMap.get(l.player_id) || '',
    }));
    while (rows.length < LINEUP_ROWS) {
      rows.push({ num: '', name: '', bid: '' });
    }
    return rows;
  }

  const homeRows = buildPlayerRows(homeStarters, homeSubs);
  const awayRows = buildPlayerRows(awayStarters, awaySubs);

  // Substitution rows per team (max 5 each)
  const SUB_ROWS = 5;
  function buildSubRows(teamId: string) {
    const teamSubs = subPairs.filter(s => s.teamId === teamId);
    const rows: { out: string; inn: string; time: string }[] = teamSubs.map(s => ({
      out: s.out.player_name || '',
      inn: s.inn.player_name || '',
      time: s.half && s.minute != null ? `${s.half} ${s.minute}'` : '',
    }));
    while (rows.length < SUB_ROWS) {
      rows.push({ out: '', inn: '', time: '' });
    }
    return rows.slice(0, SUB_ROWS);
  }

  const homeSubRows = buildSubRows(match.home_team_id);
  const awaySubRows = buildSubRows(match.away_team_id);

  // Card rows for page 2
  const CARD_ROWS = 6;
  function buildCardRows(cards: MatchEvent[]) {
    const rows: { player: string; team: string; half: string; minute: string; reason: string }[] =
      cards.map(c => ({
        player: c.player_name || '',
        team: c.team_name || '',
        half: c.half || '',
        minute: c.minute != null ? `${c.minute}'` : '',
        reason: c.notes || '',
      }));
    while (rows.length < CARD_ROWS) {
      rows.push({ player: '', team: '', half: '', minute: '', reason: '' });
    }
    return rows.slice(0, CARD_ROWS);
  }

  const yellowRows = buildCardRows(yellows);
  const redRows = buildCardRows(reds);

  // Goal movement rows
  const GOAL_MOVE_ROWS = 4;
  function buildGoalRows(goalList: MatchEvent[]) {
    const rows: { player: string; team: string; minute: string }[] = goalList.map(g => ({
      player: g.player_name || '',
      team: g.team_name || '',
      minute: g.minute != null ? `${g.minute}'` : '',
    }));
    while (rows.length < GOAL_MOVE_ROWS) {
      rows.push({ player: '', team: '', minute: '' });
    }
    return rows.slice(0, GOAL_MOVE_ROWS);
  }

  const goals1TRows = buildGoalRows(goals1T);
  const goals2TRows = buildGoalRows(goals2T);

  return (
    <>
      <style>{`
        @media print {
          nav, header, aside, .admin-sidebar, .MuiDrawer-root, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          @page { size: A4; margin: 6mm; }
          .sumula-page { page-break-after: always; padding: 4mm 6mm !important; min-height: auto !important; width: 100% !important; }
          .sumula-page:last-child { page-break-after: auto; }
        }
        @media screen {
          .sumula-page { margin-bottom: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.15); }
        }
      `}</style>

      {/* Print & Back buttons */}
      <Box className="no-print" sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => router.back()}>
          Voltar
        </Button>
        <Button variant="contained" startIcon={<Print />} onClick={() => window.print()}>
          Imprimir Sumula
        </Button>
      </Box>

      {/* =================== PAGE 1 - ESCALAÇÕES =================== */}
      <div className="sumula-page" style={PAGE_STYLE}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Prefeitura Municipal de Itapecerica
          </div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Secretaria de Cultura, Turismo e Esportes
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '3px 0' }}>
            {championship?.name || 'Campeonato Municipal de Futebol de Campo'} {championship?.year || ''}
          </div>
          <div style={{ fontSize: '8px', marginTop: '1px', fontWeight: 'bold' }}>
            SUMULA DE JOGO
          </div>
        </div>

        {/* DISPUTANTES */}
        <table style={TABLE_STYLE}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '80px' }}>DISPUTANTES</td>
              <td style={{ ...CELL, textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                {match.home_team_name || ''}
              </td>
              <td style={{ ...CELL_CENTER, width: '30px', fontSize: '12px', fontWeight: 'bold' }}>
                ({match.home_score ?? ' '})
              </td>
              <td style={{ ...CELL_CENTER, width: '20px', fontSize: '10px', fontWeight: 'bold' }}>X</td>
              <td style={{ ...CELL_CENTER, width: '30px', fontSize: '12px', fontWeight: 'bold' }}>
                ({match.away_score ?? ' '})
              </td>
              <td style={{ ...CELL, textAlign: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                {match.away_team_name || ''}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Match info row */}
        <table style={{ ...TABLE_STYLE, marginTop: '-1px' }}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '40px' }}>DATA</td>
              <td style={{ ...CELL_CENTER, width: '80px' }}>{formatDate(match.match_date)}</td>
              <td style={{ ...HEADER_CELL, width: '50px' }}>HORARIO</td>
              <td style={{ ...CELL_CENTER, width: '60px' }}>{formatTime(match.match_date)}</td>
              <td style={{ ...HEADER_CELL, width: '40px' }}>LOCAL</td>
              <td style={CELL_CENTER}>{match.venue || ''}</td>
            </tr>
          </tbody>
        </table>

        {/* JOGO / CATEGORIA / DIVISÃO / CHAVE / COND. TEMPO */}
        <table style={{ ...TABLE_STYLE, marginTop: '-1px' }}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '35px' }}>JOGO</td>
              <td style={{ ...CELL_CENTER, width: '50px' }}>{match.match_round || ''}</td>
              <td style={{ ...HEADER_CELL, width: '65px' }}>CATEGORIA</td>
              <td style={{ ...CELL_CENTER, width: '70px' }}>{championship?.category || ''}</td>
              <td style={{ ...HEADER_CELL, width: '50px' }}>DIVISAO</td>
              <td style={{ ...CELL_CENTER, width: '50px' }}></td>
              <td style={{ ...HEADER_CELL, width: '45px' }}>CHAVE</td>
              <td style={{ ...CELL_CENTER, width: '40px' }}></td>
              <td style={{ ...HEADER_CELL, width: '80px' }}>COND. TEMPO</td>
              <td style={CELL_CENTER}></td>
            </tr>
          </tbody>
        </table>

        {/* ESCALAÇÕES - Two columns side by side */}
        <div style={{ display: 'flex', gap: '0px', marginTop: '4px' }}>
          {/* Home Team */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, fontSize: '9px', backgroundColor: '#d0d0d0' }}>
                    {match.home_team_name || 'EQUIPE A'}
                  </td>
                </tr>
                <tr>
                  <td style={{ ...HEADER_CELL, width: '25px' }}>N°</td>
                  <td style={HEADER_CELL}>NOME COMPLETO</td>
                  <td style={{ ...HEADER_CELL, width: '55px' }}>INSC./ID</td>
                </tr>
              </thead>
              <tbody>
                {homeRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.num}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.name}</td>
                    <td style={{ ...CELL_CENTER, height: '14px', fontSize: '7px' }}>{r.bid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Away Team */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, fontSize: '9px', backgroundColor: '#d0d0d0' }}>
                    {match.away_team_name || 'EQUIPE B'}
                  </td>
                </tr>
                <tr>
                  <td style={{ ...HEADER_CELL, width: '25px' }}>N°</td>
                  <td style={HEADER_CELL}>NOME COMPLETO</td>
                  <td style={{ ...HEADER_CELL, width: '55px' }}>INSC./ID</td>
                </tr>
              </thead>
              <tbody>
                {awayRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.num}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.name}</td>
                    <td style={{ ...CELL_CENTER, height: '14px', fontSize: '7px' }}>{r.bid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CAPITÃO / TÉCNICO / AUXILIAR / MASSAGISTA / ROUPEIRO */}
        <table style={{ ...TABLE_STYLE, marginTop: '3px' }}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '130px' }}>CAPITAO DA EQUIPE</td>
              <td style={CELL}></td>
              <td style={{ ...HEADER_CELL, width: '130px' }}>CAPITAO DA EQUIPE</td>
              <td style={CELL}></td>
            </tr>
            {['TECNICO', 'AUXILIAR', 'MASSAGISTA', 'ROUPEIRO'].map(role => (
              <tr key={role}>
                <td style={HEADER_CELL}>{role}</td>
                <td style={CELL}></td>
                <td style={HEADER_CELL}>{role}</td>
                <td style={CELL}></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUBSTITUIÇÕES */}
        <div style={SECTION_TITLE}>SUBSTITUICOES</div>
        <div style={{ display: 'flex', gap: '0px' }}>
          {/* Home subs */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, fontSize: '8px', backgroundColor: '#d0d0d0' }}>
                    {match.home_team_name || 'EQUIPE A'}
                  </td>
                </tr>
                <tr>
                  <td style={HEADER_CELL}>SAI</td>
                  <td style={HEADER_CELL}>ENTRA</td>
                  <td style={{ ...HEADER_CELL, width: '55px' }}>TEMPO</td>
                </tr>
              </thead>
              <tbody>
                {homeSubRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.out}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.inn}</td>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Away subs */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, fontSize: '8px', backgroundColor: '#d0d0d0' }}>
                    {match.away_team_name || 'EQUIPE B'}
                  </td>
                </tr>
                <tr>
                  <td style={HEADER_CELL}>SAI</td>
                  <td style={HEADER_CELL}>ENTRA</td>
                  <td style={{ ...HEADER_CELL, width: '55px' }}>TEMPO</td>
                </tr>
              </thead>
              <tbody>
                {awaySubRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.out}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.inn}</td>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ARBITRAGEM */}
        <table style={{ ...TABLE_STYLE, marginTop: '3px' }}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '100px' }}>ARBITRO</td>
              <td style={CELL}>{refereeName}</td>
            </tr>
            <tr>
              <td style={HEADER_CELL}>ASSISTENTE N° 1</td>
              <td style={CELL}>{assistant1Name}</td>
            </tr>
            <tr>
              <td style={HEADER_CELL}>ASSISTENTE N° 2</td>
              <td style={CELL}>{assistant2Name}</td>
            </tr>
            <tr>
              <td style={HEADER_CELL}>4° ARBITRO</td>
              <td style={CELL}></td>
            </tr>
            <tr>
              <td style={HEADER_CELL}>MESARIO</td>
              <td style={CELL}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =================== PAGE 2 - EVENTOS E DECLARAÇÕES =================== */}
      <div className="sumula-page" style={PAGE_STYLE}>
        {/* Header page 2 */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Prefeitura Municipal de Itapecerica
          </div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            Secretaria de Cultura, Turismo e Esportes
          </div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '3px 0' }}>
            SUMULA DE JOGO - {match.home_team_name} X {match.away_team_name}
          </div>
        </div>

        {/* TEMPO DE JOGO E SUAS INTERRUPÇÕES */}
        <div style={SECTION_TITLE}>TEMPO DE JOGO E SUAS INTERRUPCOES</div>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              <td style={{ ...HEADER_CELL, width: '80px' }}></td>
              <td style={HEADER_CELL}>INICIO</td>
              <td style={HEADER_CELL}>TERMINO</td>
              <td style={HEADER_CELL}>ACRESCIMOS</td>
              <td style={HEADER_CELL}>INTERRUPCAO</td>
              <td style={HEADER_CELL}>MOTIVO</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL }}>1° TEMPO</td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
            </tr>
            <tr>
              <td style={{ ...HEADER_CELL }}>2° TEMPO</td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
              <td style={BLANK_LINE}></td>
            </tr>
          </tbody>
        </table>

        {/* RESULTADO FINAL */}
        <table style={{ ...TABLE_STYLE, marginTop: '6px' }}>
          <tbody>
            <tr>
              <td style={{ ...HEADER_CELL, width: '120px' }}>RESULTADO FINAL</td>
              <td style={{ ...CELL, textAlign: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                {match.home_team_name} ({match.home_score ?? ' '}) X ({match.away_score ?? ' '}) {match.away_team_name}
              </td>
            </tr>
          </tbody>
        </table>

        {/* MOVIMENTO DO PLACAR */}
        <div style={SECTION_TITLE}>MOVIMENTO DO PLACAR</div>
        <div style={{ display: 'flex', gap: '0px' }}>
          {/* 1º Tempo */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, backgroundColor: '#d0d0d0' }}>1° TEMPO</td>
                </tr>
                <tr>
                  <td style={HEADER_CELL}>JOGADOR</td>
                  <td style={HEADER_CELL}>EQUIPE</td>
                  <td style={{ ...HEADER_CELL, width: '40px' }}>MIN</td>
                </tr>
              </thead>
              <tbody>
                {goals1TRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.player}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.team}</td>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.minute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* 2º Tempo */}
          <div style={{ flex: 1 }}>
            <table style={TABLE_STYLE}>
              <thead>
                <tr>
                  <td colSpan={3} style={{ ...HEADER_CELL, backgroundColor: '#d0d0d0' }}>2° TEMPO</td>
                </tr>
                <tr>
                  <td style={HEADER_CELL}>JOGADOR</td>
                  <td style={HEADER_CELL}>EQUIPE</td>
                  <td style={{ ...HEADER_CELL, width: '40px' }}>MIN</td>
                </tr>
              </thead>
              <tbody>
                {goals2TRows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.player}</td>
                    <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.team}</td>
                    <td style={{ ...CELL_CENTER, height: '14px' }}>{r.minute}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DECLARAÇÕES DO ÁRBITRO - CARTÕES AMARELOS */}
        <div style={SECTION_TITLE}>DECLARACOES DO ARBITRO - CARTOES AMARELOS</div>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              <td style={HEADER_CELL}>JOGADOR</td>
              <td style={{ ...HEADER_CELL, width: '100px' }}>EQUIPE</td>
              <td style={{ ...HEADER_CELL, width: '45px' }}>TEMPO</td>
              <td style={{ ...HEADER_CELL, width: '40px' }}>MIN</td>
              <td style={HEADER_CELL}>MOTIVO</td>
            </tr>
          </thead>
          <tbody>
            {yellowRows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.player}</td>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.team}</td>
                <td style={{ ...CELL_CENTER, height: '14px' }}>{r.half}</td>
                <td style={{ ...CELL_CENTER, height: '14px' }}>{r.minute}</td>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* DECLARAÇÕES DO ÁRBITRO - CARTÕES VERMELHOS */}
        <div style={{ ...SECTION_TITLE, marginTop: '6px' }}>DECLARACOES DO ARBITRO - CARTOES VERMELHOS</div>
        <table style={TABLE_STYLE}>
          <thead>
            <tr>
              <td style={HEADER_CELL}>JOGADOR</td>
              <td style={{ ...HEADER_CELL, width: '100px' }}>EQUIPE</td>
              <td style={{ ...HEADER_CELL, width: '45px' }}>TEMPO</td>
              <td style={{ ...HEADER_CELL, width: '40px' }}>MIN</td>
              <td style={HEADER_CELL}>MOTIVO</td>
            </tr>
          </thead>
          <tbody>
            {redRows.map((r, i) => (
              <tr key={i}>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.player}</td>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.team}</td>
                <td style={{ ...CELL_CENTER, height: '14px' }}>{r.half}</td>
                <td style={{ ...CELL_CENTER, height: '14px' }}>{r.minute}</td>
                <td style={{ ...CELL, height: '14px', fontSize: '7.5px' }}>{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* OUTROS REGISTROS */}
        <div style={{ ...SECTION_TITLE, marginTop: '6px' }}>OUTROS REGISTROS</div>
        <table style={TABLE_STYLE}>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td style={BLANK_LINE}>{i === 0 && match.observations ? match.observations : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* RELATÓRIO COMPLEMENTAR */}
        <div style={{ ...SECTION_TITLE, marginTop: '8px' }}>
          RELATORIO COMPLEMENTAR DO ARBITRO (se necessario, usar folha anexa)
        </div>
        <table style={TABLE_STYLE}>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i}>
                <td style={BLANK_LINE}></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ASSINATURA DO ÁRBITRO */}
        <div style={{ marginTop: '12px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
            <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
              ASSINATURA DO ARBITRO
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
                <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
                  DATA DA ENTREGA
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
                <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
                  HORA DA ENTREGA
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ASSINATURAS DOS REPRESENTANTES */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
            <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
              REPR. {match.home_team_name?.toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
            <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
              REPR. {match.away_team_name?.toUpperCase()}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderBottom: '1px solid #000', height: '30px' }}></div>
            <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>
              DELEGADO / COMISSARIO
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '7px', color: '#666' }}>
          galinhagorda.vip - Sumula gerada automaticamente pelo sistema
        </div>
      </div>
    </>
  );
}
