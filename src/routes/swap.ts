import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SwapController } from '@/controllers/swapController';
import { swapRouteSchema, submitSwapRouteSchema } from '@/schemas/swap.schema';



export const swapRoutes: FastifyPluginAsync = async (fastify: FastifyInstance): Promise<void> => {
   const swapController = new SwapController();
   fastify.post('/', {schema : swapRouteSchema},  (request, reply) => swapController.handleSwap(request, reply))
   fastify.post('/submit', {schema : submitSwapRouteSchema},  (request, reply) => swapController.submitSwap(request, reply))
};


