import type { PalabraDifficultyLevel } from "@/lib/games/palabra-vortex/types";

import type { ListeningPrompt } from "./types";

function p(
  id: string,
  topic: ListeningPrompt["topic"],
  levels: PalabraDifficultyLevel[],
  spanish: string,
  mode: ListeningPrompt["mode"],
  wrongMc: [string, string, string],
  duendeHint: string,
  typeAccepted?: string[],
): ListeningPrompt {
  return { id, topic, levels, spanish, mode, wrongMc, duendeHint, typeAccepted };
}

export const LISTENING_PROMPTS: ListeningPrompt[] = [
  p("e-1", "greetings", ["easy"], "Buenos días", "mc", ["Buenas noches", "Hasta luego", "Por favor"], "Saludo matutino."),
  p("e-2", "greetings", ["easy"], "Muchas gracias", "mc", ["De nada", "Perdón", "Salud"], "Agradecimiento fuerte."),
  p("e-3", "numbers", ["easy"], "Quince", "mc", ["Cincuenta", "Trece", "Veinte"], "Número 15."),
  p("e-4", "numbers", ["easy"], "Ciento veintitrés", "mc", ["Doscientos", "Noventa", "Mil"], "Número compuesto."),
  p("e-5", "food", ["easy"], "Un café con leche", "type", ["Agua con gas", "Pan tostado", "Zumo de naranja"], "Bebida típica en bar.", ["un cafe con leche"]),
  p("e-6", "food", ["easy"], "La cuenta, por favor", "mc", ["La carta", "El menú", "Una mesa"], "Pedir la cuenta."),
  p("e-7", "places", ["easy"], "¿Dónde está el baño?", "mc", ["¿Qué hora es?", "Me llamo Ana", "Hace calor"], "Pregunta ubicación."),
  p("e-8", "time", ["easy"], "Son las tres y media", "mc", ["Es mediodía", "Mañana lunes", "Hace frío"], "Hora en punto y media."),
  p("e-9", "verbs", ["easy"], "Yo quiero aprender", "type", ["Yo puedo salir", "Tú vas bien", "Nosotros comemos"], "Verbo querer + infinitivo.", ["yo quiero aprender"]),
  p("e-10", "questions", ["easy"], "¿Cómo te llamas?", "mc", ["¿Cuántos años tienes?", "¿De dónde eres?", "¿Qué tal el viaje?"], "Nombre informal."),

  p("m-1", "food", ["medium"], "Me apetece una tortilla española", "mc", ["Me falta un tenedor", "Prefiero el pescado", "No tomo alcohol"], "Antojo (España)."),
  p("m-2", "time", ["medium"], "Pasado mañana tengo examen", "mc", ["Ayer llovió mucho", "Siempre llego tarde", "Nunca digas nunca"], "Futuro próximo."),
  p("m-3", "places", ["medium"], "Vivo en el centro de la ciudad", "type", ["Salgo a la montaña", "Trabajo desde casa", "Nado en el mar"], "Ubicación vivienda.", ["vivo en el centro de la ciudad"]),
  p("m-4", "verbs", ["medium"], "Ella ha estudiado mucho", "mc", ["Ella estudia mañana", "Ella estudiaba antes", "Ella estudiará pronto"], "Presente perfecto."),
  p("m-5", "culture", ["medium"], "Vamos a tomar algo", "mc", ["Vamos a discutir", "Vamos al médico", "Vamos de compras"], "Propuesta social (bar)."),
  p("m-6", "questions", ["medium"], "¿A qué hora cierran?", "mc", ["¿Cuánto cuesta esto?", "¿Hay descuento?", "¿Dónde pagamos?"], "Horario comercio."),
  p("m-7", "numbers", ["medium"], "Dos mil veinticinco", "mc", ["Mil novecientos", "Trescientos", "Cero coma cinco"], "Año o número grande."),
  p("m-8", "greetings", ["medium"], "Encantado de conocerte", "mc", ["Mucho gusto en verte", "Hasta la vista", "Que te vaya bien"], "Presentación formal."),
  p("m-9", "food", ["medium"], "¿Me pones una caña?", "type", ["¿Me traes la carta?", "Sobremesa, por favor", "Sin hielo, gracias"], "Pedido bar (España).", ["me pones una cana", "me pones una caña"]),
  p("m-10", "verbs", ["medium"], "No sé si vendrá", "mc", ["No sé si viene", "No sé si venía", "No sé si vendría"], "Duda + futuro/incertidumbre."),

  p("h-1", "culture", ["hard"], "Está hecho un lío", "mc", ["Está hecho polvo", "Está para el arrastre", "Está en las nubes"], "Coloquial: desorden."),
  p("h-2", "questions", ["hard"], "¿No tendrías un momento?", "mc", ["¿No tendrías hambre?", "¿No vendrías mañana?", "¿No sabrías la hora?"], "Cortesía condicional."),
  p("h-3", "verbs", ["hard"], "Hubiera preferido quedarme", "mc", ["Había preferido quedarme", "Prefiero quedarme", "Preferiría haberme quedado"], "Condicional compuesto / subjuntivo."),
  p("h-4", "time", ["hard"], "A estas alturas ya debería haber llegado", "mc", ["A estas horas ya habrá llegado", "Aún no ha llegado nunca", "Llegará cuando quiera"], "Expectativa frustrada."),
  p("h-5", "places", ["hard"], "Queda a dos manzanas de aquí", "mc", ["Queda a dos kilómetros de altura", "Queda en la esquina atrás", "Queda lejos del todo"], "Distancia urbana."),
  p("h-6", "food", ["hard"], "Me chifla la comida casera", "type", ["Me encanta el pescado frito", "Odio las lentejas", "Cocino poco los fines"], "Coloquial encantar (España).", ["me chifla la comida casera"]),
  p("h-7", "numbers", ["hard"], "Trescientos sesenta y cinco", "mc", ["Setecientos veinte", "Mil quinientos", "Cuarenta y dos"], "Número exacto."),
  p("h-8", "greetings", ["hard"], "Un placer haber coincidido", "mc", ["Un placer verte siempre", "Encantado de marcharme", "Gusto en conoceros"], "Despedida elegante."),
  p("h-9", "verbs", ["hard"], "Se me ha pasado el tiempo volando", "mc", ["Se me pasa el tiempo lento", "Me paso el día durmiendo", "Pasaba el tiempo leyendo"], "Expresión idiomática."),
  p("h-10", "culture", ["hard"], "Es un rollo tremendo", "mc", ["Es una pasada genial", "Es pan comido", "Es la repera"], "Algo aburrido (coloquial)."),

  p("x-1", "culture", ["expert"], "Ni hablar del peluquín", "mc", ["Ni caso al tema", "Ni en broma", "Ni de lejos"], "Expresión fija (ironía)."),
  p("x-2", "verbs", ["expert"], "Más vale que no se hubiera enterado", "mc", ["Más vale que no se entere", "Más valía enterarse", "Más vale tarde que nunca"], "Subjuntivo compuesto."),
  p("x-3", "questions", ["expert"], "¿Para qué quieres que te lo diga?", "mc", ["¿Por qué no me lo dijiste?", "¿Qué quieres decir con eso?", "¿Dónde quieres ir a parar?"], "Matiz retórico."),
  p("x-4", "time", ["expert"], "Cuando quieras nos ponemos al día", "type", ["Cuando puedas me llamas", "En cuanto llegue te aviso", "Antes de que anochezca"], "Quedar (ponerse al día).", ["cuando quieras nos ponemos al dia", "cuando quieras nos ponemos al día"]),
  p("x-5", "food", ["expert"], "Esto está para chuparse los dedos", "mc", ["Esto está pasado de rosca", "Esto no tiene nombre", "Esto está crudo"], "Comida deliciosa."),
  p("x-6", "places", ["expert"], "En mitad de la nada", "mc", ["En el centro del todo", "A la vuelta de la esquina", "En el quinto pino"], "Lugar remoto."),
  p("x-7", "numbers", ["expert"], "Novecientos noventa y nueve coma noventa y nueve", "mc", ["Mil novecientos noventa", "Cero coma cero uno", "Dos pi"], "Precio o decimal oral."),
  p("x-8", "greetings", ["expert"], "Que tengas un buen finde", "mc", ["Que pases buena semana", "Feliz año nuevo", "Buen viaje de vuelta"], "Fin de semana coloquial."),
  p("x-9", "verbs", ["expert"], "A estas horas ya habrán cerrado", "mc", ["A estas horas ya cerraban", "A estas horas cerrarán", "A estas horas cerraron"], "Futuro de conjetura."),
  p("x-10", "culture", ["expert"], "No tiene ni pies ni cabeza", "mc", ["Tiene mala leche", "Es uña y carne", "Se sale por las tangentes"], "Sin sentido."),
];

export function promptsForLevel(level: PalabraDifficultyLevel): ListeningPrompt[] {
  return LISTENING_PROMPTS.filter((x) => x.levels.includes(level));
}
