import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import redis from "redis";
import session from "express-session";

import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import connectRedis from "connect-redis";
import { MyContext } from "./types";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  // Run migration if any
  // await orm.getMigrator().up();
  const app = express();

  let RedisStore = connectRedis(session);
  let redisClient = redis.createClient();

  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        // disableTTL: true,
        disableTouch: true,
      }),
      secret: "RandomString", // todo: => goes to .env
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        sameSite: "lax", // csrf protecting
        secure: __prod__, // cookie only works in https
      },
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  // create graphql endpoint on express
  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
};

main().catch((err) => console.error(err));
