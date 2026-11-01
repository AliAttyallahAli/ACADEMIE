import { useEffect, useState } from 'react';

export default function useDeviceType() {
  const [device, setDevice] = useState(() => detect());

  useEffect(() => {
    const handler = () => setDevice(detect());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return device; // 'mobile' | 'tablet' | 'desktop'
}

function detect() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}