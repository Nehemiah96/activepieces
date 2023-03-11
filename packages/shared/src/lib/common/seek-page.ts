import { Type, TSchema} from '@sinclair/typebox';

export type Cursor = string | null;


export const SeekPage = <T extends TSchema>(type: T) => Type.Object({
    next: Type.Optional(Type.String({
        example: "next-cursor"
    })),
    previous: Type.Optional(Type.String({
        example: "previous-cursor"
    })),
    data: Type.Array(type),
});


export interface SeekPage<T> {
    next: Cursor;
    previous: Cursor;
    data: T[];
}