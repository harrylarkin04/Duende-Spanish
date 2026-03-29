export type QuestChoice = {
  /** Spanish label shown on the button */
  text: string;
  next: string;
};

export type QuestEnding = {
  title: string;
  /** Short wrap-up in Spanish */
  epitaph: string;
  variant: "gold" | "crimson" | "sky";
};

export type QuestNode = {
  id: string;
  /** Story beat — second person, present / past mix ok for narrative */
  narrative: string;
  choices?: QuestChoice[];
  ending?: QuestEnding;
};

export const BUENOS_AIRES_START = "ba_intro";

/** Branching travel narrative — Buenos Aires */
export const BUENOS_AIRES_NODES: Record<string, QuestNode> = {
  ba_intro: {
    id: "ba_intro",
    narrative: `Acabás de llegar a Buenos Aires. El cielo está gris con un sol que asoma como promesa. Tu hostel queda en San Telmo, pero primero tenés que salir del aeropuerto.

Un cartel indica el colectivo y el taxi. Un señor con mate en la mano te sonríe: "¿Primera vez en la ciudad?"`,
    choices: [
      {
        text: "Tomo un taxi directo al hostel — quiero llegar ya.",
        next: "ba_taxi",
      },
      {
        text: "Prefiero el colectivo: más barato y más aventura.",
        next: "ba_colectivo",
      },
    ],
  },

  ba_taxi: {
    id: "ba_taxi",
    narrative: `El taxista enciende la radio: hay debate de fútbol y opinión fuerte. "San Telmo, ¿no? Buen barrio para caminar." El viaje es rápido; pagás un poco más de lo que calculaste, pero llegás con la mochila intacta y el estómago pidiendo café.

En la puerta del hostel, el recepcionista te ofrece un mapa garabateado a mano.`,
    choices: [
      {
        text: "Salgo ya a la Feria de San Telmo: vine por el tango y las antigüedades.",
        next: "ba_feria_temprano",
      },
      {
        text: "Me voy a Palermo a buscar un café tranquilo y planificar el día.",
        next: "ba_palermo_cafe",
      },
    ],
  },

  ba_colectivo: {
    id: "ba_colectivo",
    narrative: `El colectivo va lleno; el ritmo del acelerador marca el compás. Te equivocás de bajada una vez, pero una señora te corrige con dulzura: "Acá no, corazón, dos cuadras más."

Llegás al hostel con las piernas cansadas y una historia gratis. El recepcionista te mira y dice: "Colectivero nivel avanzado. Te merecés un buen mate."`,
    choices: [
      {
        text: "Igual voy a la Feria: no quiero perderme el bullicio.",
        next: "ba_feria_tarde",
      },
      {
        text: "Primero descanso una siesta: mañana será otro día.",
        next: "ba_siesta",
      },
    ],
  },

  ba_feria_temprano: {
    id: "ba_feria_temprano",
    narrative: `La feria huele a empanadas, cera de muebles viejos y perfume barato. Un músico afina un bandoneón; otro ya cobra aplausos. Entre los puestos ves collares, discos de vinilo y un cartel que dice "Clases de tango — principiantes bienvenidos".

Un vendedor de mates te hace señas con una bombilla plateada.`,
    choices: [
      {
        text: "Me acerco al puesto de mates y pregunto por los precios.",
        next: "ba_mate_vendor",
      },
      {
        text: "Entro a la milonga improvisada y me quedo a mirar el piso de baldosas.",
        next: "ba_milonga_mira",
      },
    ],
  },

  ba_feria_tarde: {
    id: "ba_feria_tarde",
    narrative: `Llegás cuando el sol empieza a bajar. Algunos puestos ya cierran, pero el murmullo sigue. Un perro duerme bajo una mesa de fierro; un turista negocia un reloj que no anda.

Un joven te ofrece un flyer: "Show de tango esta noche, descuento estudiante."`,
    choices: [
      {
        text: "Acepto el flyer y pregunto cómo llegar al teatro.",
        next: "ba_tango_show",
      },
      {
        text: "Prefiero caminar hacia La Boca a sacar fotos de los fileteados.",
        next: "ba_la_boca",
      },
    ],
  },

  ba_palermo_cafe: {
    id: "ba_palermo_cafe",
    narrative: `Palermo te recibe con árboles, bicis y mesas en la vereda. Pedís un cortado y una medialuna; el wifi funciona cuando quiere. En la mesa de al lado, dos amigas planean ir a una feria de diseño.

La camarera, al traerte la cuenta, susurra: "Si querés pizza a la piedra de verdad, hay un lugar que no figura en las guías."`,
    choices: [
      {
        text: "Le pido la dirección de la pizza secreta.",
        next: "ba_pizza_oro",
      },
      {
        text: "Las sigo a la feria de diseño: quiero ver arte local.",
        next: "ba_feria_diseno",
      },
    ],
  },

  ba_siesta: {
    id: "ba_siesta",
    narrative: `La siesta en el hostel es profunda: sueños con subtes que nunca llegan. Cuando despertás, la ciudad ya tiene otra luz. El barrio suena distinto: menos turistas, más vecinos con parlantes bajos.

Bajás a la calle y el aire huele a cena.`,
    choices: [
      {
        text: "Busco un bodegón para comer algo simple y hablar con la gente del barrio.",
        next: "ba_bodegon",
      },
      {
        text: "Camino sin rumbo hasta una plaza con faroles amarillos.",
        next: "ba_plaza_noche",
      },
    ],
  },

  ba_mate_vendor: {
    id: "ba_mate_vendor",
    narrative: `"Este mate es de calabaza bien curada", te dice el vendedor. Negociás el precio con una sonrisa; al final te invita un sorbo de su propio termo. "Así se prueba", dice.

De repente aparece su hermana: estudia inglés y quiere practicar. Terminás charlando media hora; te pasan un grupo de WhatsApp de "extranjeros en BA".`,
    choices: [
      {
        text: "Acepto unirme al grupo y nos vemos al día siguiente en el Rosedal.",
        next: "ba_end_amigos",
      },
    ],
  },

  ba_milonga_mira: {
    id: "ba_milonga_mira",
    narrative: `Mirás los pies que trazan figuras imposibles. Una pareja te sonríe; otra te hace espacio en el borde. "¿Bailás?", pregunta alguien. Negás con la cabeza, pero el corazón acelera.

El organizador te dice que hay clase express a las ocho. El cielo se oscurece y las luces del local se encienden.`,
    choices: [
      {
        text: "Me anoto a la clase express: hoy rompo el miedo.",
        next: "ba_end_tango",
      },
    ],
  },

  ba_tango_show: {
    id: "ba_tango_show",
    narrative: `El teatro es chico pero el acústica abraza. Los músicos arrancan y el público deja de susurrar. En el entreacto, una cantante saluda en español e inglés; vos entendés las dos cosas y sonreís.

Al salir, la ciudad brilla con humedad y faroles. Sentís que el viaje valió la pena antes de terminar el primer día.`,
    choices: [
      {
        text: "Vuelvo caminando al hostel, feliz y con los pies cansados.",
        next: "ba_end_tango",
      },
    ],
  },

  ba_la_boca: {
    id: "ba_la_boca",
    narrative: `El Caminito explota de color. Sacás fotos; un artista te pinta la silueta en cinco minutos. En un callejón más oscuro, alguien te tropieza el hombro — cuando llegás al hostel, notás que el bolsillo delantero está vacío.

El recepcionista niega con la cabeza: "La Boca de noche, solo con grupo o guía, che."`,
    choices: [
      {
        text: "Aprendí la lección: mañana pido consejos locales antes de salir.",
        next: "ba_end_cartera",
      },
    ],
  },

  ba_pizza_oro: {
    id: "ba_pizza_oro",
    narrative: `El local es chiquito, el horno a la vista y el mozo te trata como si fueras de la familia. La muzzarella se estira como bandera; el ambiente huele a levadura y cerveza fría.

Un tipo al fondo alza el vaso: "¡Salud, viajero!" Respondés sin pensar, y la mesa entera aplaude.`,
    choices: [
      {
        text: "Cierro la noche con otra porción y un brindis colectivo.",
        next: "ba_end_pizza",
      },
    ],
  },

  ba_feria_diseno: {
    id: "ba_feria_diseno",
    narrative: `Emprendedores jóvenes muestran remeras, cerámica y poesía impresa. Comprás una postal con un verso en lunfardo que no entendés del todo, pero te gusta cómo suena.

Hacés fila para un café de especialidad; alguien te cuenta que mañana hay mercado de pulgas en otro barrio. El mapa de la ciudad se te hace más grande y más amable.`,
    choices: [
      {
        text: "Guardo la postal y planifico el mercado para mañana.",
        next: "ba_end_tranquilo",
      },
    ],
  },

  ba_bodegon: {
    id: "ba_bodegon",
    narrative: `El bodegón tiene mantel a cuadros y vino en jarra. El mozo te recomiña "ravioles con tuco" sin preguntar mucho. Una mesa de jubilados debate política; vos escuchás y aprendés palabras nuevas sin forzar.

Pagás en efectivo; el cambio suena como campanilla. Salís con la panza llena y la cabeza más liviana.`,
    choices: [
      {
        text: "Camino de vuelta cantando bajito una canción que sonó en la radio del lugar.",
        next: "ba_end_tranquilo",
      },
    ],
  },

  ba_plaza_noche: {
    id: "ba_plaza_noche",
    narrative: `En la plaza hay niños con patines y un señor que pasea tres perros. Te sentás en un banco; el aire fresco te ordena los pensamientos. Una abuela te ofrece caramelos de menta "por si tenés frío en el alma".

Te reís, aceptás uno, y charláis diez minutos sobre nietos y viajes. No hace falta más para sentirte menos extranjero.`,
    choices: [
      {
        text: "Agradezco y vuelvo al hostel con una sonrisa tonta.",
        next: "ba_end_tranquilo",
      },
    ],
  },

  ba_end_amigos: {
    id: "ba_end_amigos",
    narrative: "",
    ending: {
      title: "Red porteña",
      epitaph: `Conseguiste algo que no estaba en el itinerario: gente real, mate compartido y un grupo que te espera mañana. Buenos Aires te adoptó en un sorbo.`,
      variant: "gold",
    },
  },

  ba_end_tango: {
    id: "ba_end_tango",
    narrative: "",
    ending: {
      title: "Noche de tango",
      epitaph: `El bandoneón te siguió hasta la calle. Bailaste, miraste o soñaste con bailar — da igual: el ritmo ya te marcó. La ciudad te enseñó que el miedo se baila con los pies.`,
      variant: "gold",
    },
  },

  ba_end_cartera: {
    id: "ba_end_cartera",
    narrative: "",
    ending: {
      title: "Lección porteña",
      epitaph: `No todo salió bien, pero saliste con una historia y una regla nueva: ojos abiertos, consejos locales, y La Boca con más luz del día. El viaje sigue.`,
      variant: "crimson",
    },
  },

  ba_end_pizza: {
    id: "ba_end_pizza",
    narrative: "",
    ending: {
      title: "Gloria a la muzza",
      epitaph: `Encontraste el ritual argentino en su forma más honesta: pizza, cerveza y extraños que se vuelven compañía de una noche. Mañana podés caminar el mundo con otra capa de grasa feliz.`,
      variant: "gold",
    },
  },

  ba_end_tranquilo: {
    id: "ba_end_tranquilo",
    narrative: "",
    ending: {
      title: "Día a tu ritmo",
      epitaph: `Sin prisa de influencer ni checklist infinito, dejaste que la ciudad te hablara bajito. A veces el mejor español se aprende en silencios compartidos con extraños amables.`,
      variant: "sky",
    },
  },
};

export function getQuestNode(id: string): QuestNode | undefined {
  return BUENOS_AIRES_NODES[id];
}
