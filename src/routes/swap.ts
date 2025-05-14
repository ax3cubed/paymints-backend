import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { SwapController } from '@/controllers/swapController';
import { SwapRequest, SwapResponse } from '@/types/swap.types';



export const swapRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
   const swapController = new SwapController();
   fastify.post('/swap', {schema : {}},  (request, reply) => swapController.handleSwap(request.body as SwapRequest, reply))
};

 
