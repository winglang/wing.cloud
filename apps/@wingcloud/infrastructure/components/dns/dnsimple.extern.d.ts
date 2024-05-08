export default interface extern {
  createRecords: (token: string, records: (readonly (Record)[])) => Promise<void>,
  deleteRecords: (token: string, records: (readonly (Record)[])) => Promise<void>,
}
export interface Record {
  readonly content: string;
  readonly name: string;
  readonly type: string;
  readonly zone: string;
}