import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const idRef = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  // Nettoyage des accents français (important pour ton erreur précédente)
  const sanitizeMermaidCode = (inputCode: string): string => {
    return inputCode
      .replace(/é/g, "e")
      .replace(/è/g, "e")
      .replace(/ê/g, "e")
      .replace(/ë/g, "e")
      .replace(/à/g, "a")
      .replace(/â/g, "a")
      .replace(/ä/g, "a")
      .replace(/î/g, "i")
      .replace(/ï/g, "i")
      .replace(/ô/g, "o")
      .replace(/ö/g, "o")
      .replace(/ù/g, "u")
      .replace(/û/g, "u")
      .replace(/ü/g, "u")
      .replace(/ç/g, "c")
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/[^\x00-\x7F]/g, "")
      .replace(/\[([^\]]+?)\]/g, (match, label) => {
        const trimmed = label.trim();
        if (/[\(\)\[\]\{\}'"`:/\\<>|]/.test(trimmed) || trimmed.length > 35) {
          return `["${trimmed}"]`;
        }
        return match;
      });
  };

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      setSvg("");
      setError("");
      setLoading(true);

      try {
        const cleanCode = sanitizeMermaidCode(code);

        // Solution fiable : charger mermaid via script tag + window.mermaid
        if (!(window as any).mermaid) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load mermaid script"));
            document.head.appendChild(script);
          });
        }

        const mermaid = (window as any).mermaid;

        // Configuration
        mermaid.initialize?.({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
        });

        const result = await mermaid.render(idRef.current, cleanCode);
        if (!cancelled) {
          setSvg(result.svg);
        }
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        if (!cancelled) {
          setError("Erreur lors du rendu du diagramme Mermaid.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (code) {
      renderDiagram();
    }

    return () => {
      cancelled = true;
    };
  }, [code]);

  const downloadSVG = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "diagram.svg";
    a.click();
  };

  const downloadPNG = () => {
    if (!svg) return;
    const parser = new DOMParser();
    const svgEl = parser.parseFromString(svg, "image/svg+xml").querySelector("svg");

    const width = parseInt(svgEl?.getAttribute("width") || "900");
    const height = parseInt(svgEl?.getAttribute("height") || "600");
    const scale = 2;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const a = document.createElement("a");
      a.download = "diagram.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = url;
  };

  if (error) return <p className="text-red-500 text-sm mt-2">{error}</p>;
  if (loading || !svg) {
    return <p className="text-outline text-sm animate-pulse mt-2">Rendu du diagramme en cours...</p>;
  }

  return (
    <div className="mt-2 rounded-xl border border-outline-variant/20 bg-white p-4 overflow-x-auto">
      <div dangerouslySetInnerHTML={{ __html: svg }} />

      <div className="mt-3 flex gap-2">
        <button
          onClick={downloadPNG}
          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          Télécharger PNG
        </button>
        <button
          onClick={downloadSVG}
          className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
        >
          Télécharger SVG
        </button>
      </div>
    </div>
  );
}