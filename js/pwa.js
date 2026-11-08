// Rejestracja service workera + przycisk "Zainstaluj aplikację"
let deferred = null;
const listeners = new Set();
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e)));
}
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferred = e;
  listeners.forEach(f => f());
});
addEventListener('appinstalled', () => { deferred = null; listeners.forEach(f => f()); });

// Wstawia przycisk instalacji do podanego kontenera (pokazuje się tylko, gdy instalacja jest możliwa)
export function installButton(container, onInfo) {
  if (standalone()) return;
  const b = document.createElement('button');
  b.className = 'btn small install-btn';
  b.innerHTML = '<img src="icons/icon.svg" alt="" width="18" height="18"> Zainstaluj aplikację';
  b.hidden = true;
  container.append(b);
  const update = () => { b.hidden = !(deferred || isIOS); };
  listeners.add(update);
  update();
  b.onclick = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      update();
    } else if (isIOS) {
      onInfo?.('Na iPhonie: stuknij „Udostępnij”, a potem „Do ekranu początkowego”.');
    }
  };
}
