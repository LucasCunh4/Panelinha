// Entrada histórica preservada. As antigas medidas/bases foram substituídas por 470×800 + borda externa.
// Mantém verificações de recursos, interação e efeitos no motor na suíte compartilhada.
require('./cartas_470x800.cjs').run(["assets", "layout", "colors", "rules"]).catch(error=>{console.error(error);process.exitCode=1});
