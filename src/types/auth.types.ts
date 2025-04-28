

export interface JwtUser {
  id: number
  address: string
  username: string
  iat?: number
  exp?: number
}
 
// Extend FastifyRequest to include the authenticated user
declare module "fastify" {
  interface FastifyRequest {
    user: string | object | Buffer
    jwtUser?: JwtUser
    requestId: string
  }
}

