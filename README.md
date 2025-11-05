Proyecto: Plataforma de Exámenes de Certificación en lenguajes de programación o
frameworks de desarrollo. No es intercambiable el tema, todos los equipos trabajan sobre
este tipo de plataforma. 

Contexto: La plataforma ofrece certificaciones en varios lenguajes de programación y/o
frameworks de desarrollo. Tu empresa oferta 4 certificaciones, pero solo una (la que en
equipo elijan) estará funcionando el examen de certificación.

Objetivo funcional:
• Solo usuarios que hicieron login y pagaron su examen (bandera booleana) pueden
aplicar el examen.

• El back genera un examen de 8 preguntas aleatorias NO repetidas de un banco de
16 preguntas y lo envía al front.

• El front renderiza las preguntas numerándolas, presentando de forma aleatoria las
opciones en botones de radio, el usuario responde y envía sus respuestas al back.

• El back evalúa respuestas envía calificación al front indicando si aprobó o NO, si
aprobó genera un certificado PDF para entregar al front.
