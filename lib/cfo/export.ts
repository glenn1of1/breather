// Browser-only report pack for the CFO (final UI): graph PNGs, CSVs and a PDF, zipped. Every value
// comes from the server's CFO view (/api/cfo), so the pack matches the screen; hidden values stay "<5".
import type { CfoView, VerdictResult } from "@/lib/contracts";
import { graphsCsv, inputsCsv, projectionCsv, show, type Assumptions, type CfoGraph } from "./format";

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function graphImageUrl(graph: CfoGraph) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Graph images could not be created.");
  const css = getComputedStyle(document.documentElement);
  ctx.fillStyle = css.getPropertyValue("--surface").trim();
  ctx.fillRect(0, 0, 1000, 420);
  ctx.fillStyle = css.getPropertyValue("--ink").trim();
  ctx.font = "bold 24px sans-serif";
  ctx.fillText(graph.title, 28, 40);
  ctx.font = "18px sans-serif";
  ctx.fillText(graph.unit + (graph.baseline !== null ? ` · Baseline ${graph.baseline}` : ""), 28, 68);
  const values = graph.points.map((p) => p.value).filter((x): x is number => x !== null);
  const max = Math.max(1, graph.baseline ?? 0, ...values) * 1.15;
  ctx.font = "16px sans-serif";
  for (let i = 0; i <= 4; i++) {
    const y = 350 - i * 65;
    ctx.strokeStyle = css.getPropertyValue("--border").trim();
    ctx.beginPath();
    ctx.moveTo(80, y);
    ctx.lineTo(965, y);
    ctx.stroke();
    ctx.fillStyle = css.getPropertyValue("--muted").trim();
    ctx.fillText(((max * i) / 4).toFixed(max > 100 ? 0 : 1), 15, y + 5);
  }
  ctx.strokeStyle = css.getPropertyValue("--ink").trim();
  ctx.lineWidth = 3;
  ctx.beginPath();
  let connected = false;
  graph.points.forEach((p, i) => {
    const x = 80 + (i / Math.max(1, graph.points.length - 1)) * 885;
    ctx.fillText(`M${p.month}`, x - 10, 385);
    if (p.value === null) {
      connected = false;
      return;
    }
    const y = 350 - (p.value / max) * 260;
    if (connected) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
    connected = true;
  });
  ctx.stroke();
  return canvas.toDataURL("image/png");
}

/** Uses the view's own assumptions (the values its cost and graphs came from), not slider values still in flight. */
export async function buildReportPack(view: CfoView, verdict: VerdictResult) {
  const { assumptions: a, cost, graphs, inputs: rows } = view;
  const [{ default: JSZip }, { PDFDocument, StandardFonts, rgb }] = await Promise.all([import("jszip"), import("pdf-lib")]);
  const zip = new JSZip();
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const hex = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim().replace("#", "");
  const ink = rgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255);
  // Standard PDF fonts are WinAnsi: replace the few characters they cannot draw.
  const clean = (t: string) => t.replaceAll("–", "-").replaceAll("—", "-").replaceAll("·", " | ").replaceAll("→", "->").replaceAll("’", "'").replaceAll("“", '"').replaceAll("”", '"');
  const text = (page: ReturnType<typeof pdf.addPage>, value: string, y: number, size = 11, strong = false) => page.drawText(clean(value), { x: 40, y, size, font: strong ? bold : font, color: ink });

  const summary = pdf.addPage([595, 842]);
  text(summary, "SE Health | Pilot decision", 792, 24, true);
  text(summary, `${verdict.source === "jev" ? "Jev AI" : "Rules engine"} recommendation: ${verdict.category.toUpperCase()}`, 744, 18, true);
  text(summary, "Synthetic demo data | Week 13 | Projection, not a prediction", 718);
  let line = "",
    y = 680;
  for (const word of view.explanation[verdict.category].split(" ")) {
    if ((line + word).length > 78) {
      text(summary, line, y);
      y -= 18;
      line = "";
    }
    line += `${word} `;
  }
  text(summary, line, y);
  text(summary, "Continuation assumptions", y - 45, 16, true);
  const labels: [keyof Assumptions, string, string][] = [["rate", "Provider rate", "$/h"], ["hours", "Hours per caregiver", "h/month"], ["places", "Places", "places"], ["uptake", "Uptake", "%"], ["admin", "Admin fee", "%"]];
  labels.forEach(([k, label, unit], i) => text(summary, `${label}: ${a[k]} ${unit}`, y - 75 - i * 22));
  text(summary, `Monthly low / base / high: $${cost.monthly.low} / $${cost.monthly.base} / $${cost.monthly.high}`, y - 210);
  text(summary, `Yearly low / base / high: $${cost.annual.low} / $${cost.annual.base} / $${cost.annual.high}`, y - 234);
  text(summary, "Adjusted assumptions change projections, not observed pilot results.", y - 272);

  let page = pdf.addPage([595, 842]);
  text(page, "Outcomes and projections over time", 795, 20, true);
  for (const [i, graph] of graphs.entries()) {
    if (i > 0 && i % 3 === 0) {
      page = pdf.addPage([595, 842]);
      text(page, "Outcomes and projections over time", 795, 20, true);
    }
    const png = Uint8Array.from(atob(graphImageUrl(graph).split(",")[1] ?? ""), (c) => c.charCodeAt(0));
    zip.file(`graphs/${graph.id}.png`, png);
    zip.file(`csv/${graph.id}.csv`, graphsCsv([graph]));
    page.drawImage(await pdf.embedPng(png), { x: 35, y: 535 - (i % 3) * 240, width: 525, height: 220.5 });
  }

  const evidence = pdf.addPage([595, 842]);
  text(evidence, "Decision inputs | Company-wide", 792, 20, true);
  text(evidence, "Counts under 5 hidden; zero remains visible.", 762);
  rows.forEach((r, i) => {
    const top = 705 - i * 82;
    text(evidence, r.label, top, 12, true);
    text(evidence, `${r.before === null ? "" : `${show(r.before, (n) => n.toFixed(1))} -> `}${show(r.after, (n) => (r.before === null ? String(n) : n.toFixed(1)))} ${r.unit}`, top - 22);
    text(evidence, `${r.met === null ? "Context" : r.met ? "Target met" : "Below target"} | ${r.target}`, top - 42);
  });

  zip.file("pilot-decision.pdf", await pdf.save());
  zip.file("all-graphs.csv", graphsCsv(graphs));
  zip.file("cost-projection.csv", projectionCsv(cost));
  zip.file("assumptions.csv", ["Assumption,Value,Unit", ...labels.map(([k, label, unit]) => `${label},${a[k]},${unit}`)].join("\n"));
  zip.file("decision-inputs.csv", inputsCsv(rows));
  zip.file(
    "README.txt",
    "Breather synthetic demo data only. Report includes all nine graphs, planning assumptions, aggregate decision inputs and a PDF. Pilot outcomes cover months 1-3; continuation projections cover months 1-12. Counts under five are suppressed. Changed planning assumptions do not change observed outcomes or the recommendation.",
  );
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
