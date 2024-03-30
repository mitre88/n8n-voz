import 'dotenv/config'
import { createBot, MemoryDB } from '@builderbot/bot'
import AIClass from './services/ai';
import flow from './flows';
import { provider } from './provider';

const PORT = process.env.PORT ?? 3001
const ai = new AIClass(process.env.OPEN_API_KEY, 'gpt-4-0125-preview')

const main = async () => {
    const { httpServer } = await createBot({
        database: new MemoryDB(),
        provider,
        flow,
    }, { extensions: { ai } })

    httpServer(+PORT)
}
main()
