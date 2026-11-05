import {randomInt} from './protocol.mjs';
export function balanceTeams(players,duo){
  if(!duo){players.filter(Boolean).forEach(p=>p.team=null);return;}
  const count={1:0,2:0};
  const humans=players.filter(p=>p&&!p.bot);
  // Primeiro reserva todas as escolhas humanas existentes; uma entrada em vaga
  // anterior não pode deslocar de equipe quem já estava no lobby.
  for(const p of humans)if([1,2].includes(p.team))count[p.team]++;
  for(const p of humans)if(![1,2].includes(p.team)){p.team=count[1]<=count[2]?1:2;count[p.team]++;}
  for(const p of players.filter(p=>p?.bot)){
    p.team=[1,2].includes(p.team)&&count[p.team]<2?p.team:count[1]<=count[2]?1:2;count[p.team]++;
  }
}
export function chooseHost(players,next=randomInt){const humans=players.filter(p=>p&&!p.bot);return humans.length?humans[next(humans.length)].id:null;}
