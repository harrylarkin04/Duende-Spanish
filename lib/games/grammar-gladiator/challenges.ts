import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

import type { ChallengeDef } from "./types";

function ch(
  id: string,
  topic: ChallengeDef["topic"],
  levels: PalabraDifficultyLevel[],
  prompt: string,
  correct: string,
  w1: string,
  w2: string,
  w3: string,
  hintWrong: string,
  boss?: boolean,
): ChallengeDef {
  return { id, topic, levels, prompt, correct, wrong: [w1, w2, w3], hintWrong, boss };
}

/** Curated grammar arena — scales with CEFR tier */
export const GRAMMAR_CHALLENGES: ChallengeDef[] = [
  // —— Easy A1–A2 ——
  ch("e-hablar-yo", "conjugation", ["easy"], "Yo ___ español. (hablar, presente)", "hablo", "hablas", "habla", "hablamos", "Presente de yo: -o."),
  ch("e-comer-ellos", "conjugation", ["easy"], "Ellos ___ pizza. (comer, presente)", "comen", "comes", "como", "coméis", "Ellos → -en."),
  ch("e-ser-soy", "ser-estar", ["easy"], "Yo ___ estudiante. (ser)", "soy", "estoy", "eres", "son", "Profesión/identidad → ser."),
  ch("e-estar-bien", "ser-estar", ["easy"], "¿Cómo ___ tú? — ___ bien. (estar)", "estás", "eres", "soy", "va", "Estado temporal → estar."),
  ch("e-la-casa", "agreement", ["easy"], "___ casa es grande. (definido, femenino)", "La", "El", "Los", "Unas", "Casa es femenino singular."),
  ch("e-los-libros", "agreement", ["easy"], "___ libros son nuevos. (definido, masculino plural)", "Los", "Las", "El", "Un", "Libros masculino plural → los."),
  ch("e-vivir-nosotros", "conjugation", ["easy"], "Nosotros ___ en Madrid. (vivir)", "vivimos", "viven", "vivo", "vives", "-imos en nosotros."),
  ch("e-por-madrid", "por-para", ["easy"], "Paseo ___ el parque. (movimiento)", "por", "para", "de", "desde", "Movimiento a través → por."),
  ch("e-para-ti", "por-para", ["easy"], "Este regalo es ___ ti. (destinatario)", "para", "por", "con", "en", "Destino/beneficiario → para."),
  ch("e-fui-ayer", "preterite-imperfect", ["easy"], "Ayer ___ al cine. (ir, pasado puntual)", "fui", "iba", "voy", "ido", "Hecho acabado ayer → pretérito."),
  ch("ez-boss-1", "conjugation", ["easy"], "Tú ___ muy simpático. (ser, rasgo)", "eres", "es", "soy", "estás", "Tú + ser de rasgo → eres.", true),
  ch("ez-boss-2", "conjugation", ["easy"], "Ellas ___ cansadas después del viaje. (estar)", "están", "son", "estamos", "estáis", "Estado físico → estar.", true),

  // —— Medium B1 ——
  ch("m-subj-dudo", "subjunctive", ["medium"], "Dudo que ___ verdad. (ser)", "sea", "es", "será", "era", "Tras dudar → subjuntivo."),
  ch("m-subj-ojala", "subjunctive", ["medium"], "Ojalá ___ tiempo mañana. (hacer)", "haga", "hace", "hará", "hizo", "Ojalá + subjuntivo (deseo)."),
  ch("m-aunque-llueva", "subjunctive", ["medium"], "Aunque ___, saldremos. (llover)", "llueva", "llueve", "llovió", "lloverá", "Aunque + subj. (concesión hipotética)."),
  ch("m-estar-cansado", "ser-estar", ["medium"], "Hoy ___ muy cansado. (estado)", "estoy", "soy", "estás", "va", "Estado físico → estar."),
  ch("m-es-listo", "ser-estar", ["medium"], "Mi hermano ___ muy listo. (cualidad estable)", "es", "está", "estuvo", "será", "Rasgo de carácter → ser."),
  ch("m-por-razon", "por-para", ["medium"], "Lo hice ___ tu bien. (causa)", "por", "para", "sobre", "tras", "Causa/motivo → por."),
  ch("m-para-lograr", "por-para", ["medium"], "Estudio ___ aprobar. (finalidad)", "para", "por", "sin", "tras", "Finalidad → para + infinitivo."),
  ch("m-cantidad-por", "por-para", ["medium"], "Pago cinco euros ___ hora. (tarifa)", "por", "para", "de", "en", "Tasa unitaria → por."),
  ch("m-imperfect-accustom", "preterite-imperfect", ["medium"], "De niño, ___ al parque cada domingo. (ir)", "iba", "fui", "voy", "iré", "Hábito pasado → imperfecto."),
  ch("m-pret-one-shot", "preterite-imperfect", ["medium"], "De repente ___ un ruido terrible. (oír)", "oí", "oía", "oye", "oiré", "Evento puntual → pretérito."),

  // —— Hard B2 ——
  ch("h-subj-sin-que", "subjunctive", ["hard"], "Se fue sin que nadie lo ___. (ver)", "viera", "veía", "vio", "verá", "Sin que + subjuntivo."),
  ch("h-subj-cuando", "subjunctive", ["hard"], "Cuando ___ el mensaje, avísame. (llegar)", "llegues", "llegas", "llegarás", "llegaste", "Cuando + subj. futuro en cláusula temporal."),
  ch("h-fuese", "subjunctive", ["hard"], "Si ___ tú, no lo aceptaría. (ser)", "fueras", "eras", "serías", "seras", "Condicional irreal si + imperfecto de subj."),
  ch("h-haber-habido", "conjugation", ["hard"], "___ muchos cambios. (haber, presente perfecto)", "Ha habido", "Hay habido", "Hubo habido", "Habiendo", "Presente perfecto de haber + participio."),
  ch("h-concordancia", "agreement", ["hard"], "___ agua está fría. (agua + adjetivo, artículo)", "El", "La", "Los", "Unas", "Agua lleva el aunque es femenina (fonética)."),
  ch("h-interesado", "agreement", ["hard"], "Está muy ___ en el tema. (participio activo)", "interesado", "interesada", "interesantes", "interesar", "Participio con sujeto el que siente → interesado."),
  ch("h-por-instalaciones", "por-para", ["hard"], "Gracias ___ su paciencia. (formula)", "por", "para", "a", "en", "Gracias por + sustantivo."),
  ch("h-para-colmo", "por-para", ["hard"], "___ colmo, empezó a llover. (locución)", "Para", "Por", "De", "A", "Para colmo — fórmula fija."),
  ch("h-mientras-estudiaba", "preterite-imperfect", ["hard"], "Mientras ___, sonó el teléfono. (estudiar, fondo)", "estudiaba", "estudié", "estudio", "estudiaré", "Fondo imperfecto + interrupción pretérito."),

  // —— Expert C1–C2 ——
  ch("x-subj-cualquiera", "subjunctive", ["expert"], "___ que sea el precio, lo compro. (cualquier)", "Cualquiera", "Cualquier", "Cualesquiera", "Cualquiera que", "Cualquiera que + subjuntivo."),
  ch("x-fuera-verdad", "subjunctive", ["expert"], "No creo que ___ así. (ser, subj.)", "sea", "es", "sería", "era", "Negación + creer → subjuntivo."),
  ch("x-como-si", "subjunctive", ["expert"], "Habla como si ___ el dueño. (ser)", "fuera", "es", "era", "será", "Como si + imperfecto/pluscuamperfecto de subj."),
  ch("x-hubiera-sabido", "subjunctive", ["expert"], "Si lo ___, no habría venido. (saber)", "hubiera sabido", "habría sabido", "sabía", "supiera", "Condicional compuesto + pluperfect subj."),
  ch("x-estuvo-divino", "ser-estar", ["expert"], "La fiesta ___ divina anoche. (evento puntual)", "estuvo", "estaba", "es", "será", "Resultado percibido de un evento → estar + adj (colloquial elevated)."),
  ch("x-lo-interesante", "agreement", ["expert"], "___ interesante es la propuesta. (artículo neutro)", "Lo", "El", "La", "Los", "Lo + adjetivo = sustantivación."),
  ch("x-por-miedo", "por-para", ["expert"], "No habló ___ miedo a ofender. (causa negativa)", "por", "para", "de", "sin", "Por + sustantivo (causa)."),
  ch("x-para-que-quede", "por-para", ["expert"], "Cierra la ventana ___ que no entre el frío. (finalidad)", "para", "por", "de", "sin", "Para que + subj. (finalidad)."),
  ch("x-llevaba", "preterite-imperfect", ["expert"], "___ tres años viviendo allí cuando lo conocí. (llevar)", "Llevaba", "Llevé", "Llevo", "Había llevado", "Llevar + tiempo + gerundio = duration background."),

  // —— Cross-tier (medium+) ——
  ch("mx-boss-1", "subjunctive", ["medium", "hard", "expert"], "Es posible que el tren ___. (llegar, tarde)", "llegue tarde", "llega tarde", "llegó tarde", "llegará tarde", "Es posible que + subjuntivo.", true),
  ch("mx-boss-2", "ser-estar", ["medium", "hard", "expert"], "La sopa ___ salada; no me gusta. (sabor resultante)", "está", "es", "será", "estuvo", "Resultado de preparación (sabor) → estar.", true),
  ch("mx-boss-3", "conjugation", ["hard", "expert"], "Para entonces ya se ___. (ir, futuro perfecto)", "habrán ido", "habían ido", "irán", "han ido", "Futuro perfecto de subjuntivo / analítico.", true),
  ch("mx-boss-4", "por-para", ["medium", "hard"], "Luchamos ___ la libertad. (causa ideal)", "por", "para", "contra", "sin", "Luchar por + causa.", true),
  ch("mx-boss-5", "agreement", ["hard", "expert"], "___ altas montañas nevadas se ven al fondo. (demostrativo fem. plural)", "Aquellas", "Aquellos", "Ese", "Esta", "Concordancia en género y número.", true),
];

export function challengesForLevel(level: PalabraDifficultyLevel): ChallengeDef[] {
  return GRAMMAR_CHALLENGES.filter((c) => c.levels.includes(level));
}

export function bossChallengesForLevel(level: PalabraDifficultyLevel): ChallengeDef[] {
  return challengesForLevel(level).filter((c) => c.boss);
}
