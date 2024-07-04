export interface ILoggerService {
  setContext(tagName: string): void
  warn(message: string): void
  error(message: string): void
  info(message: string): void
}
