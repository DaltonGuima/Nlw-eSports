import express, { request, response } from 'express';
import cors from 'cors';

import * as client from '@prisma/client'
import { convertHourStringToMinutes} from './utils/convert-hours-string-to-minute';
import { convertMinutesToHours } from './utils/convert-minutes-string-to-hours';

const app = express()
app.use(express.json())

//Para filtrar requisões do front-end
app.use(cors())

const prisma = new client.PrismaClient({
    log: ['query']   
});

/* parâmetros
    Query: usa para salvar estados, usados por exemplo em filtros
    Body: diversas requisões
    Route: não nomeados
*/

/* localhost:3333/ads */
//Rotas são ligações de caso de uso

app.get('/games', async(request, response) => {

    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    });

    return response.json(games);
})

//post cria // HTTP code, algo foi criado
app.post('/games/:id/ads', async(request, response) => {
    const gameId = request.params.id;

    //sem validação, zod para fazer validação
    const body:any = request.body;
    const hourS =  convertHourStringToMinutes(body.hourStart)
    const hourE =  convertHourStringToMinutes(body.hourEnd) 

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name : body.name,
            yearsPlaying : body.yearsPlaying,
            discord : body.discord,
            weekDays : body.weekDays.join(','),
            hourEnd : hourE,
            hourStart : hourS,
            useVoiceChannel : body.useVoiceChannel,
        }
    })

    return response.status(201).json(ad);
})

app.get('/games/:id/ads', async(request, response) => {

    const gameId = request.params.id;
    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            weekDays: true,
            useVoiceChannel: true,
            yearsPlaying: true,
            hourStart: true,
            hourEnd: true,
        },
        where: {
            //gameId
            gameId: gameId
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return  response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(","),//agora virou array
            hourStart: convertMinutesToHours(ad.hourStart),
            hourEnd: convertMinutesToHours(ad.hourEnd)
        }
    }));
});

app.get('/ads/:id/discord', async(request, response) => {

    const adId = request.params.id;
    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    })
    

    return  response.json(ad);
});



app.listen(3333)