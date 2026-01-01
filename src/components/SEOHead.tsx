import { useEffect } from 'react';

interface SEOHeadProps {
  jsonLd?: object | object[];
}

export function SEOHead({ jsonLd }: SEOHeadProps) {
  useEffect(() => {
    if (!jsonLd) return;

    const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    const scriptIds: string[] = [];

    schemas.forEach((schema, index) => {
      const scriptId = `jsonld-${index}-${Date.now()}`;
      scriptIds.push(scriptId);

      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      scriptIds.forEach(id => {
        const script = document.getElementById(id);
        if (script) {
          script.remove();
        }
      });
    };
  }, [jsonLd]);

  return null;
}
