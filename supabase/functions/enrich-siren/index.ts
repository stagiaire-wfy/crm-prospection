import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SIRENE_BASE = "https://api.insee.fr/api-sirene/3.11";

// NAF (code APE) -> secteur used in the CRM, best-effort mapping for the
// artisan trades this CRM targets. Exact code match is tried first, then a
// broader 2-digit "division" fallback below.
const NAF_EXACT: Record<string, string> = {
  "43.21A": "Électricien",
  "43.21B": "Électricien",
  "43.22A": "Plombier",
  "43.22B": "Chauffagiste",
  "43.29A": "Isolation maison/combles",
  "43.31Z": "Plaquiste",
  "43.32A": "Menuisier extérieur",
  "43.32B": "Serrurier",
  "43.33Z": "Carreleur",
  "43.34Z": "Peintre en bâtiment",
  "43.91A": "Charpentier",
  "43.91B": "Couvreur",
  "43.99A": "Étancheur",
  "43.99C": "Maçon",
  "43.12A": "Terrassier",
  "43.13Z": "Terrassier",
  "81.30Z": "Paysagiste",
  "41.20A": "Constructeur maison individuelle",
  "41.20B": "Entreprise de rénovation générale",
};

const NAF_DIVISION_FALLBACK: Record<string, string> = {
  "01": "Agriculture", "02": "Agriculture", "03": "Agriculture",
  "10": "Alimentation & Restauration", "11": "Alimentation & Restauration", "56": "Alimentation & Restauration",
  "45": "Automobile",
  "64": "Banque & Finance", "65": "Banque & Finance", "66": "Banque & Finance",
  "46": "Commerce & Distribution", "47": "Commerce & Distribution",
  "69": "Droit & Juridique",
  "70": "Conseil & Services", "71": "Conseil & Services", "72": "Conseil & Services", "74": "Conseil & Services", "78": "Conseil & Services", "82": "Conseil & Services",
  "85": "Éducation & Formation",
  "35": "Énergie", "36": "Énergie", "37": "Énergie", "38": "Énergie", "39": "Énergie",
  "58": "High-Tech & Informatique", "62": "High-Tech & Informatique", "63": "High-Tech & Informatique",
  "55": "Hôtellerie & Tourisme", "79": "Hôtellerie & Tourisme",
  "68": "Immobilier",
  "05": "Industrie & Manufacturing", "06": "Industrie & Manufacturing", "07": "Industrie & Manufacturing",
  "16": "Industrie & Manufacturing", "17": "Industrie & Manufacturing", "18": "Industrie & Manufacturing",
  "19": "Industrie & Manufacturing", "20": "Industrie & Manufacturing", "22": "Industrie & Manufacturing",
  "23": "Industrie & Manufacturing", "24": "Industrie & Manufacturing", "25": "Industrie & Manufacturing",
  "26": "Industrie & Manufacturing", "27": "Industrie & Manufacturing", "28": "Industrie & Manufacturing",
  "29": "Industrie & Manufacturing", "30": "Industrie & Manufacturing", "31": "Industrie & Manufacturing",
  "32": "Industrie & Manufacturing", "33": "Industrie & Manufacturing",
  "49": "Logistique & Transport", "50": "Logistique & Transport", "51": "Logistique & Transport", "52": "Logistique & Transport", "53": "Logistique & Transport",
  "59": "Médias & Communication", "60": "Médias & Communication", "73": "Médias & Communication", "90": "Médias & Communication", "91": "Médias & Communication",
  "86": "Santé & Pharmacie", "87": "Santé & Pharmacie", "88": "Santé & Pharmacie",
  "61": "Télécommunications",
  "13": "Textile & Mode", "14": "Textile & Mode", "15": "Textile & Mode",
};

const EFFECTIF_LABELS: Record<string, string> = {
  "NN": "Non renseigné", "00": "0 salarié", "01": "1 à 2 salariés", "02": "3 à 5 salariés",
  "03": "6 à 9 salariés", "11": "10 à 19 salariés", "12": "20 à 49 salariés",
  "21": "50 à 99 salariés", "22": "100 à 199 salariés", "31": "200 à 249 salariés",
  "32": "250 à 499 salariés", "41": "500 à 999 salariés", "42": "1000 à 1999 salariés",
  "51": "2000 à 4999 salariés", "52": "5000 à 9999 salariés", "53": "10000 salariés ou plus",
};

function guessSecteur(nafCode: string | null | undefined): string | null {
  if (!nafCode) return null;
  if (NAF_EXACT[nafCode]) return NAF_EXACT[nafCode];
  const division = nafCode.slice(0, 2);
  return NAF_DIVISION_FALLBACK[division] || null;
}

// deno-lint-ignore no-explicit-any
function formatAdresse(a: any): { adresse: string; code_postal: string; ville: string } {
  if (!a) return { adresse: "", code_postal: "", ville: "" };
  const numero = a.numeroVoieEtablissement || "";
  const type = a.typeVoieEtablissement || "";
  const libelle = a.libelleVoieEtablissement || "";
  const adresse = [numero, type, libelle].filter(Boolean).join(" ").trim();
  return {
    adresse,
    code_postal: a.codePostalEtablissement || "",
    ville: a.libelleCommuneEtablissement || "",
  };
}

// deno-lint-ignore no-explicit-any
function normalizeEtablissement(etab: any) {
  const ul = etab.uniteLegale || {};
  const { adresse, code_postal, ville } = formatAdresse(etab.adresseEtablissement);
  const nafCode = ul.activitePrincipaleUniteLegale || etab.activitePrincipaleRegistreMetiersEtablissement || null;
  return {
    siren: etab.siren,
    siret: etab.siret,
    entreprise: ul.denominationUniteLegale || ul.denominationUsuelle1UniteLegale || null,
    naf_code: nafCode,
    secteur_suggestion: guessSecteur(nafCode),
    adresse,
    code_postal,
    ville,
    effectif_label: EFFECTIF_LABELS[ul.trancheEffectifsUniteLegale] || null,
    date_creation: ul.dateCreationUniteLegale || null,
    actif: ul.etatAdministratifUniteLegale === "A",
  };
}

async function sireneFetch(path: string, apiKey: string) {
  const res = await fetch(`${SIRENE_BASE}${path}`, {
    headers: { "X-INSEE-Api-Key-Integration": apiKey },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("INSEE_SIRENE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "INSEE_SIRENE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const mode = body.mode as "lookup" | "search";

    if (mode === "lookup") {
      const raw = String(body.siren_siret || "").replace(/\D/g, "");
      if (raw.length !== 9 && raw.length !== 14) {
        return new Response(
          JSON.stringify({ error: "SIREN (9 chiffres) ou SIRET (14 chiffres) invalide" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (raw.length === 14) {
        const { ok, status, data } = await sireneFetch(`/siret/${raw}`, apiKey);
        if (!ok) {
          return new Response(
            JSON.stringify({ error: data?.header?.message || "Établissement introuvable" }),
            { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ result: normalizeEtablissement(data.etablissement) }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // SIREN only: fetch the head-office establishment for address/NAF data
      const q = `siren:${raw} AND etablissementSiege:true`;
      const { ok, status, data } = await sireneFetch(`/siret?q=${encodeURIComponent(q)}&nombre=1`, apiKey);
      if (!ok || !data.etablissements?.length) {
        return new Response(
          JSON.stringify({ error: data?.header?.message || "Entreprise introuvable" }),
          { status: ok ? 404 : status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ result: normalizeEtablissement(data.etablissements[0]) }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "search") {
      const query = String(body.query || "").trim();
      if (query.length < 2) {
        return new Response(
          JSON.stringify({ error: "Requête trop courte" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const escaped = query.replace(/"/g, '\\"');
      const q = `denominationUniteLegale:"${escaped}" AND etablissementSiege:true`;
      const { ok, status, data } = await sireneFetch(`/siret?q=${encodeURIComponent(q)}&nombre=8`, apiKey);
      if (!ok) {
        return new Response(
          JSON.stringify({ error: data?.header?.message || "Recherche impossible" }),
          { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const results = (data.etablissements || []).map(normalizeEtablissement);
      return new Response(
        JSON.stringify({ results }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "mode doit être 'lookup' ou 'search'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
