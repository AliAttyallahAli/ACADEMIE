import { useEffect, useState } from 'react';

export default function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Détection mode standalone (app installée)
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    setIsInstalled(standalone);

    // Capture du prompt d'installation
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Détection installation réussie
    const installed = () => setIsInstalled(true);
    window.addEventListener('appinstalled', installed);

    // Enregistrer le service worker (uniquement en production)
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        setRegistration(reg);
        // Détecter mise à jour disponible
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        });
      }).catch((err) => {
        console.warn('Service Worker non enregistré :', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  async function promptInstall() {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      return true;
    }
    return false;
  }

  function applyUpdate() {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }

  return {
    canInstall: !!installPrompt && !isInstalled,
    isInstalled,
    updateAvailable,
    promptInstall,
    applyUpdate,
  };
}