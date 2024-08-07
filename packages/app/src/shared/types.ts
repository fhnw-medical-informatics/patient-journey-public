export type Loadable<T> =
  | {
      type: 'loading-pending'
    }
  | {
      type: 'loading-in-progress'
    }
  | ({
      type: 'loading-complete'
    } & T)
  | {
      type: 'loading-error'
      error: string
    }
