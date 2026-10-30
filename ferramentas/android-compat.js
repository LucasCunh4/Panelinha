// Compatibilidade do contêiner Android; não altera as regras nem os arquivos web.
import 'core-js/actual/string/replace-all';

// A mesa consulta/cancela as animações WAAPI do indicador de direção.
// WebViews antigos podem não ter nenhuma das APIs de consulta, embora animate exista.
if (!Element.prototype.getAnimations) {
  const running = new WeakMap();
  const nativeAnimate = Element.prototype.animate;
  if (nativeAnimate) {
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      writable: true,
      value(...args) {
        const animation = nativeAnimate.apply(this, args);
        if (!running.has(this)) running.set(this, new Set());
        const list = running.get(this);
        list.add(animation);
        const remove = () => list.delete(animation);
        if (animation.finished) animation.finished.then(remove, remove);
        animation.addEventListener('finish', remove, { once:true });
        animation.addEventListener('cancel', remove, { once:true });
        return animation;
      }
    });
  }
  Object.defineProperty(Element.prototype, 'getAnimations', {
    configurable: true,
    writable: true,
    value() {
      if (document.getAnimations) {
        return document.getAnimations().filter(animation => animation.effect && animation.effect.target === this);
      }
      return Array.from(running.get(this) || []).filter(animation => animation.playState !== 'finished' && animation.playState !== 'idle');
    }
  });
}
