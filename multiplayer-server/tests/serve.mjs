import {startRuntime} from './runtime.mjs';
const {mf,url}=await startRuntime({port:Number(process.env.PORT||8787),durableObjectsPersist:'.wrangler/local-tests'});
console.log('Servidor local de testes:',url);
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await mf.dispose();process.exit(0);});
