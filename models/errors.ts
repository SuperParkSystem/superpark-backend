
export type ModelError = {
    type: string,
    field: string | undefined,
}

export const NoError = "ERROR_NONE"
export const DuplError = "ERROR_DUPL"
export const NotExistError = "ERROR_NOTEXIST"
export const UnknownError = "ERR_UNKNOWN"
export const SomeError = "SomeError"; // Represents an error
export const DbError = "DbError"; 