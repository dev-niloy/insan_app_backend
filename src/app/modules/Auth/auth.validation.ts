import { z } from "zod";

const UserRegisterZodValidation = z.object({
  body: z
    .object({})

});


// Login validation schema
const UserLoginZodValidation = z.object({
  body: z.object({}),
});


export const UserValidation = {
  UserRegisterZodValidation,
  UserLoginZodValidation,
};
