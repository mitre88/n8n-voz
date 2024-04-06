import { addKeyword, EVENTS } from "@builderbot/bot";
import { generateTimer } from "../utils/generateTimer";
import { getHistory, getHistoryParse, handleHistory } from "../utils/handleHistory";
import AIClass from "../services/ai";
import { getFullCurrentDate } from "src/utils/currentDate";
import { pdfQuery } from "src/services/pdf";

const PROMPT_SELLER = `Como experto en el departamento de admisiones de la unoversidad CEEA con aproximadamente 15 años de experiencia en embudos de ventas y generación de leads, tu tarea es mantener una conversación agradable, responder a las preguntas del cliente sobre nuestras ofertas académicas y, finalmente, guiarlos para completar su proceso de inscripción. Tus respuestas deben basarse únicamente en el contexto proporcionado:

### DÍA ACTUAL
{CURRENT_DAY}

### HISTORIAL DE CONVERSACIÓN (Cliente/Vendedor)
{HISTORY}

### BASE DE DATOS
{DATABASE}

Para proporcionar respuestas más útiles, puedes utilizar la información proporcionada en la base de datos. El contexto es la única información que tienes. Ignora cualquier cosa que no esté relacionada con el contexto.

### EJEMPLOS DE RESPUESTAS IDEALES:

- hola bienvenido a la universiad CEEA

### INTRUCCIONES

- MUY IMPORTANTE : no debes ofrecer ni hablar de licenciaturas, maestrías o doctorados que no tenemos.

- Si se te pregunta sobre algo no cubierto en la base de datos, indica amablemente que no tienes información al respecto y redirige la conversación a nuestros programas.

- Guía al cliente a través del proceso de inscripción con instrucciones y enlaces claros.

- Ofrece conectar con un asesor CEEA para preguntas detalladas o técnicas.


- Finaliza tus participaciones con el hashtag #somosCEAA.
- Al mencionar una carrera, proporciona una breve descripción.
- Continúa la conversación sin saludar en primera persona.

-No invites a agendar una cita al menos que el cliente te lo pida eplicitamente.

-Nunca digas que tomas la información desde una base de datos, documento o de una página o número de página.
 -si el cliente quiere inscribirse invítalo a realizar el deposito y a mandar sus documentos escaneados.
-nunca des los costos por semestre , solo dalos por mes.


Respuesta útil adecuadas para enviar por WhatsApp (en español):`


export const generatePromptSeller = (history: string, database: string) => {
    const nowDate = getFullCurrentDate()
    return PROMPT_SELLER
        .replace('{HISTORY}', history)
        .replace('{CURRENT_DAY}', nowDate)
        .replace('{DATABASE}', database)
};

const flowSeller = addKeyword(EVENTS.ACTION)
    .addAnswer(`🤖`)
    .addAction(async (_, { state, flowDynamic, extensions }) => {
        try {

            const ai = extensions.ai as AIClass
            const lastMessage = getHistory(state).at(-1)
            const history = getHistoryParse(state)

            const dataBase = await pdfQuery(lastMessage.content)
            console.log({ dataBase })
            const promptInfo = generatePromptSeller(history, dataBase)

            const response = await ai.createChat([
                {
                    role: 'system',
                    content: promptInfo
                }
            ])

            await handleHistory({ content: response, role: 'assistant' }, state)

            const chunks = response.split(/(?<!\d)\.\s+/g);

            for (const chunk of chunks) {
                await flowDynamic([{ body: chunk.trim(), delay: generateTimer(150, 250) }]);
            }
        } catch (err) {
            console.log(`[ERROR]:`, err)
            return
        }
    })

export { flowSeller }
