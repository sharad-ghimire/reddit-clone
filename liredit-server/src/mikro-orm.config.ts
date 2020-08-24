import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";

import { User } from "./entities/User";
import { Post } from "./entities/Post";

export default {
  entities: [Post, User],
  dbName: "liredit",
  debug: !__prod__,
  type: "mongo",
} as Parameters<typeof MikroORM.init>[0];
// Parameters returns an array
// Type that MikroORM init expects for its first parameter

// 3c17dd1e6b814ffc87490883405d0475
