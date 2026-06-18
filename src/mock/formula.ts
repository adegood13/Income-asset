/* =============================================================================
 * SEAM 2b — USER-DEFINED FORMULA EVALUATOR  (MOCK)
 * -----------------------------------------------------------------------------
 * A tiny, safe arithmetic evaluator so admins can WRITE OUT a calculation
 * instead of relying on hardcoded methods. No eval / new Function — we tokenize
 * and evaluate with a recursive-descent parser.
 *
 * Language:
 *   numbers            84000   0.5   12
 *   operators          + - * / and parentheses
 *   months             number of documents on the analysis (e.g. statements)
 *   sum("text")        sum of the current value of every non-excluded field
 *                      whose label contains "text" OR whose group equals "text",
 *                      across all documents
 *
 * Examples:
 *   sum("Box 1 — Wages") / 12
 *   sum("Deposits") / months
 *   (sum("Net Profit") + sum("Depreciation")) / 12
 *
 * Production replaces this with the real versioned rules engine / formula DSL.
 * ========================================================================== */

import type { CalcStep, DocumentRecord } from "../types";
import { asNumber, formatMoney } from "../lib/format";

type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" }
  | { t: "(" }
  | { t: ")" }
  | { t: "sum"; arg: string }
  | { t: "ident"; name: string };

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = src;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if ((c >= "0" && c <= "9") || c === ".") {
      let j = i + 1;
      while (j < s.length && ((s[j] >= "0" && s[j] <= "9") || s[j] === ".")) j++;
      const num = Number(s.slice(i, j));
      if (!Number.isFinite(num)) throw new Error(`Invalid number "${s.slice(i, j)}"`);
      tokens.push({ t: "num", v: num });
      i = j;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") {
      tokens.push({ t: "op", v: c });
      i++;
      continue;
    }
    if (c === "(") {
      tokens.push({ t: "(" });
      i++;
      continue;
    }
    if (c === ")") {
      tokens.push({ t: ")" });
      i++;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9_]/.test(s[j])) j++;
      const name = s.slice(i, j);
      i = j;
      if (name === "sum") {
        // expect ( "..." )
        while (s[i] === " ") i++;
        if (s[i] !== "(") throw new Error('sum must be followed by ("…")');
        i++;
        while (s[i] === " ") i++;
        const q = s[i];
        if (q !== '"' && q !== "'") throw new Error('sum("…") needs a quoted field name');
        i++;
        let arg = "";
        while (i < s.length && s[i] !== q) arg += s[i++];
        if (s[i] !== q) throw new Error("Unterminated quote in sum(…)");
        i++;
        while (s[i] === " ") i++;
        if (s[i] !== ")") throw new Error("sum(…) missing closing )");
        i++;
        tokens.push({ t: "sum", arg });
        continue;
      }
      tokens.push({ t: "ident", name });
      continue;
    }
    throw new Error(`Unexpected character "${c}"`);
  }
  return tokens;
}

interface Resolver {
  sum: (arg: string) => number;
  ident: (name: string) => number;
}

// Recursive-descent parser/evaluator. Records each resolved term for lineage.
function evaluate(tokens: Token[], resolve: Resolver, terms: Map<string, number>): number {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr(): number {
    let val = parseTerm();
    while (peek() && peek().t === "op" && ((peek() as { v: string }).v === "+" || (peek() as { v: string }).v === "-")) {
      const op = (next() as { v: string }).v;
      const rhs = parseTerm();
      val = op === "+" ? val + rhs : val - rhs;
    }
    return val;
  }
  function parseTerm(): number {
    let val = parseFactor();
    while (peek() && peek().t === "op" && ((peek() as { v: string }).v === "*" || (peek() as { v: string }).v === "/")) {
      const op = (next() as { v: string }).v;
      const rhs = parseFactor();
      if (op === "/") {
        val = rhs === 0 ? 0 : val / rhs;
      } else {
        val = val * rhs;
      }
    }
    return val;
  }
  function parseFactor(): number {
    const tk = peek();
    if (!tk) throw new Error("Unexpected end of formula");
    if (tk.t === "op" && tk.v === "-") {
      next();
      return -parseFactor();
    }
    if (tk.t === "op" && tk.v === "+") {
      next();
      return parseFactor();
    }
    if (tk.t === "num") {
      next();
      return tk.v;
    }
    if (tk.t === "sum") {
      next();
      const v = resolve.sum(tk.arg);
      terms.set(`Σ "${tk.arg}"`, v);
      return v;
    }
    if (tk.t === "ident") {
      next();
      const v = resolve.ident(tk.name);
      terms.set(tk.name, v);
      return v;
    }
    if (tk.t === "(") {
      next();
      const v = parseExpr();
      if (!peek() || peek().t !== ")") throw new Error("Missing closing )");
      next();
      return v;
    }
    throw new Error("Unexpected token in formula");
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error("Unexpected trailing input");
  return result;
}

function makeResolver(docs: DocumentRecord[]): Resolver {
  return {
    sum: (arg: string) => {
      const needle = arg.toLowerCase();
      let total = 0;
      for (const d of docs) {
        for (const f of d.fields) {
          if (f.excluded) continue;
          if (f.type !== "financial") continue;
          if (f.label.toLowerCase().includes(needle) || (f.group ?? "").toLowerCase() === needle) {
            total += asNumber(f.value);
          }
        }
      }
      return total;
    },
    ident: (name: string) => {
      if (name === "months" || name === "docs" || name === "count") return docs.length || 1;
      throw new Error(`Unknown variable "${name}" (use months or sum("…"))`);
    },
  };
}

export interface FormulaResult {
  value: number;
  steps: CalcStep[];
  error?: string;
}

// Evaluate a formula against an analysis's documents and produce lineage steps.
export function evaluateFormula(formula: string, docs: DocumentRecord[]): FormulaResult {
  const terms = new Map<string, number>();
  try {
    const tokens = tokenize(formula);
    if (tokens.length === 0) throw new Error("Empty formula");
    const value = evaluate(tokens, makeResolver(docs), terms);
    const steps: CalcStep[] = [];
    for (const [label, v] of terms) {
      steps.push({ label, detail: "resolved from documents", result: Math.round(v * 100) / 100 });
    }
    steps.push({
      label: "Result",
      detail: formula,
      result: Math.round(value * 100) / 100,
      emphasis: "subtotal",
    });
    return { value: Math.round(value * 100) / 100, steps };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid formula";
    return {
      value: 0,
      steps: [{ label: "Formula error", detail: msg, result: 0, emphasis: "flag" }],
      error: msg,
    };
  }
}

// Parse-only check (resolves variables to 1) for live validation in the editor.
export function validateFormula(formula: string): string | null {
  const terms = new Map<string, number>();
  try {
    const tokens = tokenize(formula);
    if (tokens.length === 0) return "Empty formula";
    evaluate(tokens, { sum: () => 1, ident: () => 1 }, terms);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : "Invalid formula";
  }
}

// Pretty preview of the computed value (for the editor), or the error.
export function formulaPreview(formula: string, docs: DocumentRecord[]): string {
  const r = evaluateFormula(formula, docs);
  return r.error ? r.error : formatMoney(r.value, { cents: true });
}
