import {
  Resolver,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  ObjectType,
} from "type-graphql";
import argon2 from "argon2";

import { MyContext } from "../types";
import { User } from "../entities/User";

@InputType() // for args
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType() // for return
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          { field: "username", message: "length must be greater than 2" },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);

    const user = em.create(User, {
      username: options.username,
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      return {
        errors: [{ field: "username", message: err.message }],
      };
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // look up user by username
    const user = await em.findOne(User, { username: options.username });

    if (!user) {
      return {
        errors: [{ field: "username", message: "Username does not exist" }],
      };
    }

    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [{ field: "password", message: "Incorrect password" }],
      };
    }

    // for session
    req.session.userId = user.id;

    return {
      user,
    };
  }
}
