import { Type } from "@sinclair/typebox";

export interface BaseModel<T> {
  id: T;
  created: string;
  updated: string;
}

export const BaseModelSchema = {
  id: Type.String({
    example: "9m7dpndtY3IUvUvCv5WY0",
  }),
  created: Type.String({
    example: "2023-03-09T18:29:49.146Z",
  }),
  update: Type.String({
    example: "2023-03-09T18:29:49.146Z",
  }),
}