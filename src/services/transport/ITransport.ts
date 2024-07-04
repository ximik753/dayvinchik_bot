export interface ITransportService {
  startPolling(): Promise<void>
}

export interface ITransportController {
  bind(): void
}
