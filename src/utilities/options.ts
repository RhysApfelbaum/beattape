export function makeOptions<T>(options: T): {
    [P in keyof T]?: T[P]
} {
    return options;
}
