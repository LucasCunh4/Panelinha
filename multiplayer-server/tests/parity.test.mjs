import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../../IMPORTACAO_PANELAS/motor.js';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/paridade-offline.json',import.meta.url),'utf8'));
for(const scenario of fixture.cases)test('paridade com motor offline '+fixture.sourceCommit+': '+scenario.name,()=>{
 const state=structuredClone(scenario.initial);let seed=scenario.seed;
 const core=globalThis.PanelinhaRules.create({getState:()=>state,now:()=>scenario.now,
  random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},
  name:id=>id===0?'Chef 0':'Bot '+id,
  startTurn(pause=0){state.drawn=null;state.preUno=false;state.token++;state.unlockAt=scenario.now+(state.o.cut?pause:Math.min(400,pause));state.cutOpen=!!(state.o.cut&&pause>0&&state.finisher===null);state.deadline=state.o.timeout?state.unlockAt+state.o.timeout*1000:0;}
 });
 const operation={buyHuman:'buy',callUno:'announceUNO'}[scenario.operation]||scenario.operation;core[operation](...scenario.args);
 const actual=JSON.parse(JSON.stringify(Object.fromEntries(fixture.fields.filter(k=>k in state).map(k=>[k,state[k]]))));
 assert.deepEqual(actual,scenario.expected);
});
