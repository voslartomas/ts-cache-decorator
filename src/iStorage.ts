export interface IStorage {
    getItem<T>(key: string): Promise<T>
    setItem(key: string, content: string, ttl: number): Promise<void>
    clearItem(key: string): Promise<void>
    prefixClear(prefix: string): Promise<void>
    clear(): Promise<void>
}
