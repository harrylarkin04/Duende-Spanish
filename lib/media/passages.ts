export type MediaPassage = {
  id: string;
  title: string;
  subtitle: string;
  /** BCP-47 for Web Speech */
  speechLang: string;
  /** Spanish body — interactive transcript */
  text: string;
  level: "A2" | "B1" | "B2";
  minutes: number;
};

export const MEDIA_PASSAGES: MediaPassage[] = [
  {
    id: "plaza-verano",
    title: "Plaza de verano",
    subtitle: "Micro-relato · España",
    speechLang: "es-ES",
    level: "B1",
    minutes: 3,
    text: `El mercado ya olía a pan caliente y a hierbas frescas. Las abuelas hablaban bajo la sombra del tejado rojo, mientras los niños corrían entre los puestos. Un vendedor silbó una melodía suave, casi sin darse cuenta, y la plaza respondió con risas.

Más tarde, cuando el sol bajó, la ciudad cambió de color. Las ventanas se encendieron una a una, como estrellas que bajaban a la calle. Alguien dijo que el verano en esta ciudad era una historia larga, contada en voz baja entre vecinos.

Yo guardé la frase en el bolsillo, como quien guarda una moneda brillante. No sabía si era verdad, pero esa noche caminé más despacio, escuchando la música lejana y repitiendo palabras nuevas hasta que sonaran mías.`,
  },
  {
    id: "café-mañana",
    title: "Café de mañana",
    subtitle: "Costumbres · México",
    speechLang: "es-MX",
    level: "A2",
    minutes: 2,
    text: `Por la mañana, el café huele a acuerdo silencioso: todos saben qué hacer, pero nadie tiene prisa. La mesa está llena de tazas, de pan dulce y de noticias suaves que no apuran el corazón.

Si alguien pregunta cómo estás, puedes decir "bien, gracias" y seguir el ritual. El idioma aquí no es solo gramática: es ritmo, pausa, una sonrisa cuando la frase no sale perfecta. Eso también es aprender.`,
  },
  {
    id: "música-ciudad",
    title: "Ruido bonito",
    subtitle: "Urbano · Latinoamérica",
    speechLang: "es-419",
    level: "B2",
    minutes: 4,
    text: `La ciudad no tiene un solo acento. En la esquina suena un altavoz con salsa; en la otra, un músico afina una guitarra como quien afila paciencia. El tráfico respira, frena, vuelve a respirar.

Aprender en medio de ese ruido es un ejercicio raro: no se trata de entender todo, sino de dejar que las palabras te encuentren cuando caminas. A veces una frase corta — "dale tiempo", "acá estamos" — abre más que un párrafo entero.

Si tocas una palabra en la transcripción, el Duende te traduce al instante. Si la guardas, se queda contigo, como una luz pequeña en la mochila.`,
  },
];

export function getPassage(id: string): MediaPassage | undefined {
  return MEDIA_PASSAGES.find((p) => p.id === id);
}
