import { useState, useRef, useEffect } from 'react';
import {
  Share2, Facebook, Twitter, Linkedin, Send, Mail, Copy, Check,
  MessageCircle, X,
} from 'lucide-react';

/**
 * Bouton de partage multi-réseaux.
 *
 * @param {string} url         URL à partager (défaut : window.location.href)
 * @param {string} title       Titre de la bourse
 * @param {string} description Description courte
 * @param {string} variant     'icon' | 'compact' | 'full'
 */
export default function ShareButton({
  url,
  title = '',
  description = '',
  variant = 'icon',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = title || 'Découvrez cette bourse sur ALKHER ACADEMY';
  const shareText = description
    ? `${shareTitle}\n\n${description}`
    : shareTitle;

  const encoded = encodeURIComponent;
  const links = {
    whatsapp: `https://wa.me/?text=${encoded(`${shareText}\n\n${shareUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encoded(shareText)}&url=${encoded(shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded(shareUrl)}`,
    telegram: `https://t.me/share/url?url=${encoded(shareUrl)}&text=${encoded(shareText)}`,
    email: `mailto:?subject=${encoded(shareTitle)}&body=${encoded(`${shareText}\n\n${shareUrl}`)}`,
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: description || '', url: shareUrl });
        setOpen(false);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async function handleMainClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.share) {
      const ok = await nativeShare();
      if (ok) return;
    }
    setOpen(!open);
  }

  const shareNetworks = [
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'hover:bg-green-50 hover:text-green-600', href: links.whatsapp },
    { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'hover:bg-blue-50 hover:text-blue-600', href: links.facebook },
    { key: 'twitter', label: 'X (Twitter)', icon: Twitter, color: 'hover:bg-gray-100 hover:text-gray-900', href: links.twitter },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'hover:bg-blue-50 hover:text-blue-700', href: links.linkedin },
    { key: 'telegram', label: 'Telegram', icon: Send, color: 'hover:bg-sky-50 hover:text-sky-600', href: links.telegram },
    { key: 'email', label: 'Email', icon: Mail, color: 'hover:bg-gray-100 hover:text-gray-900', href: links.email },
  ];

  const buttonContent = () => {
    if (variant === 'full') return (<><Share2 className="mr-2 h-4 w-4" />Partager</>);
    if (variant === 'compact') return (<><Share2 className="mr-1 h-3 w-3" />Partager</>);
    return <Share2 className="h-4 w-4" />;
  };

  const buttonClass = () => {
    if (variant === 'full') return 'btn-secondary';
    if (variant === 'compact') return 'inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200';
    return 'rounded-lg p-2 text-gray-600 hover:bg-gray-100';
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        type="button"
        onClick={handleMainClick}
        className={buttonClass()}
        title="Partager"
      >
        {buttonContent()}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <div className="mb-2 flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium text-gray-600">Partager via</span>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1">
            {shareNetworks.map((n) => {
              const Icon = n.icon;
              return (
                <a
                  key={n.key}
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition ${n.color}`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </a>
              );
            })}
          </div>

          <div className="mt-2 border-t border-gray-200 pt-2">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 truncate bg-transparent text-xs text-gray-600 focus:outline-none"
              />
              <button
                onClick={(e) => { e.stopPropagation(); copyLink(); }}
                className={`flex-shrink-0 rounded p-1.5 ${copied ? 'text-green-600' : 'text-alkher-600 hover:bg-white'}`}
                title="Copier le lien"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {copied && <p className="mt-1 text-center text-xs text-green-600">✓ Lien copié !</p>}
          </div>
        </div>
      )}
    </div>
  );
}
