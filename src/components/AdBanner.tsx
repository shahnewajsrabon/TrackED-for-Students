import React, { useEffect } from 'react';

interface AdBannerProps {
  dataAdClient?: string;
  dataAdSlot?: string;
  dataAdFormat?: string;
  dataFullWidthResponsive?: boolean;
  className?: string;
}

export default function AdBanner({
  dataAdClient = 'ca-pub-8116688214593496',
  dataAdSlot = '8072888137',
  dataAdFormat = 'auto',
  dataFullWidthResponsive = true,
  className = '',
}: AdBannerProps) {
  useEffect(() => {
    let timeoutId: any;
    
    const pushAd = () => {
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle || [];
          adsbygoogle.push({});
        }
      } catch (err: any) {
        if (err && err.message && err.message.includes("already have ads in them")) {
          // Strict mode re-render ignores
        } else if (err && err.message && err.message.includes("availableWidth=0")) {
          // Retry later if container size is still 0
          timeoutId = setTimeout(pushAd, 200);
        } else {
          console.error('AdSense error:', err);
        }
      }
    };

    // Small delay to ensure the DOM is painted and parent container has width
    timeoutId = setTimeout(pushAd, 100);
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className={`w-full overflow-hidden flex justify-center items-center py-4 bg-brand-surface border border-brand-border rounded-xl relative min-h-[90px] min-w-[250px] ${className}`}>
      {/* Placeholder text visible during development or if ads are blocked */}
      <div className="absolute text-brand-text-secondary/50 text-xs font-medium uppercase tracking-widest text-center px-4">
        Advertisement Placeholder
        <br />
        <span className="text-[10px] normal-case tracking-normal">
          (Insert AdSense/AdMob Publisher ID in code)
        </span>
      </div>
      
      <ins
        className="adsbygoogle relative z-10 w-full"
        style={{ display: 'block', minWidth: '250px' }}
        data-ad-client={dataAdClient}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      />
    </div>
  );
}
